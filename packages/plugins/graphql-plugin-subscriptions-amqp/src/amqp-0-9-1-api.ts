/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 *
 * This file is part of Neo4j.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import amqp from "amqplib";

export type ConnectionOptions = amqp.Options.Connect | string;

type AmqpApiOptions = {
    exchange: string;
};

enum Status {
    RUNNING,
    STOPPED,
    CONNECTING,
}

export class AmqpApi<T> {
    public channel: amqp.Channel | undefined;
    public readonly exchange: string;
    public connection?: amqp.Connection;
    private status: Status = Status.STOPPED;

    constructor({ exchange }: AmqpApiOptions) {
        this.exchange = exchange;
    }

    public async connect(amqpConnection: ConnectionOptions, cb: (msg: T) => void): Promise<void> {
        this.status = Status.CONNECTING;
        this.connection = await amqp.connect(amqpConnection);
        this.connection.on("close", () => {
            this.channel = undefined;
            if (this.status === Status.RUNNING) {
                this.reconnect(amqpConnection, cb);
            }
        });

        this.channel = await this.createChannel(this.connection);
        const queueName = await this.createQueue(this.channel);

        await this.channel.consume(queueName, (msg) => {
            if (msg !== null) {
                this.consumeMessage(msg, cb);
            }
        });
        this.status = Status.RUNNING;
    }

    private reconnect(amqpConnection: ConnectionOptions, cb: (msg: T) => void): void {
        setTimeout(() => {
            this.connect(amqpConnection, cb).catch(() => {
                this.reconnect(amqpConnection, cb);
            });
        }, 1000);
    }

    public publish(message: T): void {
        if (!this.channel) throw new Error("AMQP Channel does not exists");
        const serializedMessage = JSON.stringify(message);
        this.channel.publish(this.exchange, "", Buffer.from(serializedMessage));
    }

    public async close(): Promise<void> {
        this.status = Status.STOPPED;
        await this.channel?.close();
        await this.connection?.close();
        this.channel = undefined;
        this.connection = undefined;
    }

    private async createChannel(connection: amqp.Connection): Promise<amqp.Channel> {
        const channel = await connection.createChannel();
        await channel.assertExchange(this.exchange, "fanout", { durable: false });
        return channel;
    }

    private async createQueue(channel: amqp.Channel): Promise<string> {
        const queue = await channel.assertQueue("", { exclusive: true }); // Creates queue with unique name, will be closed on amqp connection closed

        const queueName = queue.queue;
        await channel.bindQueue(queueName, this.exchange, ""); // binds exchange and queue
        return queueName;
    }

    private consumeMessage(msg: amqp.ConsumeMessage, cb: (msg: T) => void): void {
        const messageBody = JSON.parse(msg.content.toString()) as T;
        try {
            cb(messageBody);
        } catch (err) {
            console.warn("Error consuming message", err);
        } finally {
            this.channel?.ack(msg);
        }
    }
}

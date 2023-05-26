import Cypher from "@neo4j/cypher-builder";
import type { QueryResult, Session } from "neo4j-driver";

export function neo4jExpect(session: Session): Neo4jExpectation {
    return new Neo4jExpectation(session);
}

/** Defers an execution until a promise is awaited */
class DeferredPromise<T = void> extends Promise<T> {
    private executor: () => Promise<T>;
    private resultPromise: Promise<T> | undefined; // Memoize the promise, to avoid executing the executor twice if awaited twice

    constructor(executor: () => Promise<T>) {
        super(() => {
            // Dummy callback to make Promise happy
        });
        this.executor = executor;
    }

    // Overrides Promise's then, so it executes the executor when the promise is awaited.
    public then<TResult1 = T, TResult2 = never>(
        onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | null | undefined,
        onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined
    ): Promise<TResult1 | TResult2> {
        if (!this.resultPromise) {
            this.resultPromise = this.executor();
        }

        return this.resultPromise.then(onfulfilled, onrejected);
    }
}

// Expectations to add:
// Multiple labels
// Properties
// Have multiple expectations in same request?
// Relationships

/**
 * Check for pattern existence:
 *  expect(session).toMatchPattern(pattern)
 *
 * Pattern Elements Count
 *   expect(session).toMatchPattern(pattern).toHaveCount(2)
 *
 *
 *
 */

class Neo4jExpectation extends DeferredPromise<QueryResult> {
    private session: Session;
    private expectedLabels: string[] = [];
    private expectProps?: Record<string, any>;

    constructor(session) {
        super(() => this.run());
        this.session = session;
    }

    // public toMatchPattern(pattern: Cypher.Pattern) {}

    public label(label: string): this {
        this.expectedLabels.push(label);
        return this;
    }

    public properties(props: Record<string, unknown>): this {
        this.expectProps = props;
        return this;
    }

    private async run(): Promise<QueryResult> {
        const { cypher, params } = this.createQuery().build();
        const result = await this.session.run(cypher, params);
        if (result.records.length === 0) throw new Error();
        return result;
    }

    private createQuery(): Cypher.Clause {
        const node = new Cypher.Node({ labels: this.expectedLabels });
        const pattern = new Cypher.Pattern(node).withProperties(Cypher.utils.toCypherParams(this.expectProps || {}));
        return new Cypher.Match(pattern).return(node);
    }
}

export type { Neo4jExpectation };

FROM ibmjava:8-jre@sha256:c518a629aec5fd4b00334c2ac88622cfb5830ccfab17c194f09f1de582e36ca0
WORKDIR /usr/local/qpid
RUN apt-get update && apt-get install -y curl \
    && curl https://dlcdn.apache.org/qpid/broker-j/8.0.6/binaries/apache-qpid-broker-j-8.0.6-bin.tar.gz \
    | tar -xz
ENV QPID_WORK=/var/qpidwork
COPY config.json /var/qpidwork/
WORKDIR /usr/local/qpid/qpid-broker/8.0.6
CMD ["bin/qpid-server"]
EXPOSE 5672/tcp
EXPOSE 8080/tcp

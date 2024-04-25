FROM ibmjava:8-jre@sha256:16b05236ec0fe54b6dc8fd989aa5720d5d0a41ad37d7fab639fd1bcbbc74dfab
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

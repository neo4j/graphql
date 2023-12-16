FROM ibmjava:8-jre@sha256:3a7e8f0c0919898521abac9932fdd4bc7feac50201d0ebb4e675e214b0c7b86f
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

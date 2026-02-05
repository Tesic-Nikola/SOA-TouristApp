FROM golang:alpine AS builder
WORKDIR /app
COPY . .
RUN go mod download
RUN go mod tidy
RUN go build -o blog-service .

FROM alpine:latest
RUN apk --no-cache add ca-certificates
WORKDIR /root/
COPY --from=builder /app/blog-service .
EXPOSE 8082
CMD ["./blog-service"]
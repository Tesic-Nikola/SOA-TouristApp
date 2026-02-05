FROM golang:alpine AS builder
WORKDIR /app
COPY . .
RUN go mod download
RUN go mod tidy
RUN go build -o followers-service .

FROM alpine:latest
RUN apk --no-cache add ca-certificates
WORKDIR /root/
COPY --from=builder /app/followers-service .
EXPOSE 8083
CMD ["./followers-service"]
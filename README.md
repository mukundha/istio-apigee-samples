# Istio and Apigee Samples

Samples to demonstrate how Apigee can be used to secure, productize services managed by Istio that are `http2`, `grpc` and `websockets`   

## Pre-requisites
- Kubernetes Cluster with Apigee Istio adapter installed
    - instructions to setup available [here](https://docs.apigee.com/api-platform/istio-adapter/installation#installation)
- `wscat` 
    - used for websocket testing, You can install from [here](https://www.npmjs.com/package/wscat)
- `curl`, `nodejs`, `docker` 
    - if you plan to run client tests or build images from scratch

#### http2
Helloworld `http2` server, you can use `curl` to  test this service

Run
```
node index.js
```
Test
```
curl --http2 localhost:8080
```

#### grpc
Server Source for this sample available [here](https://github.com/grpc/grpc/blob/master/examples/node/dynamic_codegen/greeter_server.js).

`proto` file and client code provided here for convenience

Run
```
docker run -p50051:50051 gcr.io/hipster-apim-demo/nodegreeter```
```
Test
```
npm install
node client.js 
```

#### websocket
Websocket echo server, test using `wscat`

Run
```
npm install
node index.js
```
Test
```
wscat -c localhost:8080/ws
```

## Setup
(disable apigee authorization rule, if already enabled)

```
kubectl apply -f deploy-manifests
kubectl apply -f istio-manifests/api-gateway.yaml
```

Verify
```
export GATEWAY_URL=http://$(kubectl -n istio-system get service istio-ingressgateway -o jsonpath='{.status.loadBalancer.ingress[0].ip}')

curl --http2 $GATEWAY_URL -v

wscat -c $GATEWAY_URL/ws

#update grpc/client.js to use GATEWAY_URL and 
node client.js
```

### Enforce Key Authentication

Follow the steps [here](https://docs.apigee.com/api-platform/istio-adapter/installation#configure_the_apigee_adapter) to enable Key authentication for these services

Now, when you run the verify steps, all the calls will result in `HTTP 403, Forbidden` errors with this message  `PERMISSION_DENIED:apigee-handler.apigee.istio-system:missing authentication`

### Get An API Key

Follow the steps [here](https://docs.apigee.com/api-platform/istio-adapter/installation#get_an_api_key) to get an API Key. (Bonus: try to setup a developer portal and obtain key from the portal)

Verify

```
wscat -c $GATEWAY_URL/ws -H 'x-api-key: <api-key>'
```

```
curl --http2 $GATEWAY_URL -v -H 'x-api-key: <api-key>'
```

Add this after Line #38 in `grpc/client.js`
```
metadata.add('x-api-key', '<api-key>')
```
then run,
```
node client.js
```

You will notice all calls with valid keys return successful responses. After a few minutes you can observer analytics data showing up for these servcies in Apigee.

## Setup TLS at Ingress

Generate a self-signed certificate
```
openssl req -x509 -out localhost.crt -keyout localhost.key \
  -newkey rsa:2048 -nodes -sha256 \
  -subj '/CN=localhost' -extensions EXT -config <( \
   printf "[dn]\nCN=localhost\n[req]\ndistinguished_name = dn\n[EXT]\nsubjectAltName=DNS:localhost\nkeyUsage=digitalSignature\nextendedKeyUsage=serverAuth")
   
```

Install the certs in your k8s cluster

```
kubectl create -n istio-system secret tls istio-ingressgateway-certs --key localhost.key --cert localhost.crt

export TLS_GATEWAY_URL=https://$(kubectl -n istio-system get service istio-ingressgateway -o jsonpath='{.status.loadBalancer.ingress[0].ip}')

curl $TLS_GATEWAY_URL -k -H 'x-api-key: <api-key>'

wscat -c $TLS_GATEWAY_URL/ws -H 'x-api-key: <api-key>' -n

```
for grpc, there is some problem in `nodejs` client for self-signed certs, try the `go` client

```
cd grpc
go run client.go
```

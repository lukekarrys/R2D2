# R2D2

Ring my R2D2 phone.

```
   .-""-.
  /[O] __\
 _|__o LI|_
/ | ==== | \
|_| ==== |_|
 ||" ||  ||
 ||LI  o ||
 ||'----'||
/__|    |__\
```

### Usage

Here's how I have this running currently, future Luke:

**Deploy**

On development machine:

1. Login to ghcr.io registry:

   ```
   gh token | docker login ghcr.io -u lukekarrys --password-stdin
   ```

1. Build and push new image:

   ```
   ./build.sh
   ./push.sh
   ```

On server:

1. Pull latest image

   ```
   docker pull ghcr.io/lukekarrys/r2d2
   ```

1. Stop and remove container

   ```
   docker stop r2d2
   docker rm r2d2
   ```

1. Run container

   ```
   docker run -d --restart=always -p 5038:5038/tcp -p 5060:5060/udp -p 8000:8000/tcp --name r2d2 -e ADMIN_USER=<USER> -e ADMIN_SECRET=<SECRET> ghcr.io/lukekarrys/r2d2
   ```

**Env Vars**

```sh
ADMIN_USER=USERNAME
ADMIN_SECRET=PASSWORD
```

**Configure and Run Docker Container**

```sh
./build.sh
./run.sh # ./run.sh --interactive locally to debug stuff
```

### CLI

This connects directly to the Asterisk Manager Interface running inside the Docker container:

```sh
npx @lukekarrys/r2d2@latest -h $HOST -u USERNAME -p PASSWORD
```

### Web

Send a `POST` request to port `8000` on the Docker container with a username and password:

```sh
curl $HOST:8000/call -X POST -d "username=USERNAME&password=PASSWORD"
```

If you only want to be able to hit it via this URL, you can not expose port `5038` in the `Dockerfile` and `run.sh` script. The server and AMI are running in the same container.

### Obihai Setup

**Server**
![server instructions](docs/server.png)

**SIP**
![sip instructions](docs/sip.png)

### History

I originally wrote this in 2014 (see the [blog post](http://lukecod.es/2014/03/28/beep-boop-ringing-an-r2d2-telephone-with-obihai-asterisk-and-node/)). I wanted to get it working again, so now it's a Docker container and CLI that can be run via `npx`.

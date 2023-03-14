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

**Sync Files to Server**

```sh
ssh server "cd /volume1/docker && rm -rf r2d2/ && mkdir r2d2 && cd r2d2 && curl -L https://github.com/lukekarrys/R2D2/tarball/main | tar xzvf - --strip-components=1"
```

Alternatively run this from this repo on your local machine, to copy everything over before pushing:

```sh
rsync -avh . /Volumes/docker/r2d2 --delete --exclude="node_modules/"
```

**Configure and Run Docker Container**

```sh
echo -e "ADMIN_USER=USERNAME\nADMIN_SECRET=PASSWORD" > .env
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

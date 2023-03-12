# R2D2

Ring my R2D2 phone.

![R2D2](https://i.cloudup.com/H3R1OaYCMx.png)

### Usage

Here's how I have this running currently, future Luke:

1. Get files on local Synology: `npm run sync`. Alternatively, download and unpack the tarball for this repo.
1. `ssh lukekarrys@synology`: ssh into the synology and `cd` to the directory
1. Build the docker container: `./build.sh`
1. Run the docker container: `./run.sh` (locally, do `./run.sh interactive` to debug stuff)

### CLI

```sh
npx @lukekarrys/r2d2 -h HOST -u USERNAME -p PASSWORD
```

### FAQ

#### What does this have to do with R2D2?

Oh, nothing really. Except everything.

#### You've been looking at asterisk conf files and documentation for too long, haven't you?

Maybe. But that's not the point.

#### Then what is the point? Really I'm _dying_ to know.

I can run `npm link` and then run `R2D2` and my [R2D2 telephone](http://www.amazon.com/Telemania-Star-Wars-Novelty-Phone/dp/B00001U0IG) will ring.

#### Whaaaaaaa?!! You weren't kidding! This is a game changer! I want my own!

**I KNOW RIGHT!?** I need to write up a blog post about this. If there is no link here yet, please bug me about it. [_Update: [did it.](http://lukecod.es/2014/03/28/beep-boop-ringing-an-r2d2-telephone-with-obihai-asterisk-and-node/)_] I'm [@lukekarrys](https://twitter.com/lukekarrys) on Twitter.

#### I was still being sarcastic. Really, does this have any purpose?

Nope, just the old hack 'n' learn. Maybe I'll hook it up to something cool? Like a tweet listener? So people can scare the crap out of me with my incredibly loud R2D2 phone in my office?

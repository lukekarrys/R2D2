#!/usr/bin/env sh

asterisk -rx 'channel originate SIP/r2d2 extension'
asterisk -rx 'channel request hangup all'

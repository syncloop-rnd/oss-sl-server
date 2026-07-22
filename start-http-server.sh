#!/bin/bash
cd integration\middleware\tenants\default\gui\
http-server -p 3000 . --proxy http://localhost:3000?
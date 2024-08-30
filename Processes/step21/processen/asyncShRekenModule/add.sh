#!/bin/bash

#>&2 echo "error"

if [ $2 == 0 ]
then
  >&2 echo "2nd argument can't be zero"
  exit 1
fi

echo $(($1 + $2));
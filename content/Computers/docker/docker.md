title: Docker Cheatsheet
date: 2021/03/03
description: A short summary of the most common docker commands.
main_image: docker.svg

## Introduction
Docker is an open source tool for building and delivering applications within portable containers.

### Docker Image
An image is a read-only file that contains all the software, files, and dependencies of a system. An image is built from a Dockerfile that describes what goes into a Docker image. A Docker image is a bit like cloning the drive of a computer that has been set up with all files and dependencies you need to run an application; however, through the magic of docker, the image doesn't need to contain the underlining operating system kernel, and therefore can be very small.

### Docker Container  
A container is a virtualised runtime environment that allows an application to run isolated from a host system. Unlike traditional virtual machines, where the entire operating system is virtualised, a container shares the kernel with the host operating system. This means containers can be very lightweight. A docker image provides the starting point (template) for a docker container.

## Running a Docker container
### Run a container
```sh
# Command format:
$ docker run [OPTIONS] <image_name>:<tag> [CMD]
# Command example:
$ docker run python:3.9.2-slim
```
If the specified image doesn't exist locally, docker will pull it down from a docker registry. The default registry is called Docker Hub. Specifying ```python:3.9.2-slim``` is effectively the same as ```docker.io/library/python:3.9.2-slim```. A different registry can be specified using ```docker run <url_to_registry>/image_name:tag```

Tags are used to represent different versions of an image. If a tag is not specified ```:latest``` is used. It is almost always best to specify a specific tag.

When the container runs it executes ```<ENTRYPOINT> <CMD>```. The ```ENTRYPOINT``` is the first part of the command that runs in the container. The ```ENTRYPOINT``` can be specified in the Dockerfile, but in many images it is blank. This means that the container just runs ```CMD```. The default ```CMD``` is typically specified in the Dockerfile, but it is overridden if ```CMD``` is specified when calling ```docker run```. If ```ENTRYPOINT``` is not blank the ```CMD``` is just appended to the end of it.

When the process started by executing ```<ENTRYPOINT> <CMD>``` exits the container will stop.

### Name a container
The name of a container is used to reference that specific container instance. A name can be provided using the```--name``` parameter. If a name is not specified then the container is given random name like `elastic_joliot`. 
```sh
# Command format:
$ docker run --name <container_name> <image_name>:<tag>
# Command example:
$ docker run --name python_app_test python:3.9.2-slim
```
### Run a container with an interactive bash session
```sh
# In most cases just override the CMD with /bin/bash
$ docker run -it <image_name>:<tag> /bin/bash

# In some cases it might be necessary to override the ENTRYPOINT as well
$ docker run -it --entrypoint "" <image_name>:<tag> /bin/bash
```
Anything after the ```<image_name>:<tag>``` in a docker run command will be interpreted as the CMD to run in the container.

### Foreground and background mode
By default docker runs in foreground mode and attaches the host's console to STDOUT and STDERR, but not STDIN. 

STDOUT/ERR from the docker container can be piped and redirected on the host like a normal host process.
```sh
# Piping the container STDOUT to a process running on the host
$ docker run <image_name>:<tag> | <host_command>
# Redirecting the container STDOUT to a file on the host
$ docker run <image_name>:<tag> > file_on_host_machine.txt

```

STDIN can be attached to the host console using the ```-i``` argument. 
```sh
# This will feed the host's STDIN directly into the container process
# Press Ctrl-d to send the end of file flag.
$ docker run -i <image_name>:<tag> 

# It is more common for STDIN to be piped into docker when using just the -i argument
# This pipes STDOUT from <host_command> into the container's process
$ <host_command> | docker run -i <image_name>:<tag> 
```

The ```-i``` argument is most commonly used with the ```-t``` argument which allocates a pseudo-TTY connected to the containers STDIN. (See above section:  *Run a container with an interactive bash session*)

To run a container in the background use the ```-d``` argument.
```sh
$ docker run -d <image_name>:<tag>
```

### Publishing a port from the docker container
Publishing a container's port allows it be accessed from the host. This is needed if, for example, you are running a service like a webserver in a container.

```sh
# Command format
$ docker run -p <host_port>:<container_port> <image_name>:<tag>
# Command example
$ docker run -p 8080:80 nginx
```
Inside the container nginx is running on port 80, but on the host it has been mapped to port 8080. Browsing to http://localhost:8080 on the host will show a **Welcome to nginx** page.

Publishing a port is different to the ```EXPOSE``` statement in a Dockerfile. ```EXPOSE``` makes the port available to other docker containers running on the host. Publishing a port exposes it, but also binds it to a port on the host. ```-P``` publishes all exposed ports and binds them to random unused ports on the host.

### Mount a volume inside a docker container
Volumes can be mounted in three main ways: bind mounts, named volumes, and anonymous volumes.

A bind mount directly mounts a directory from the host into the container. This is commonly used but it is not best practice as it is dependent on the directory structure and OS of the host machine. Bind mounts can have poor performance on Windows hosts using WSL2. 

With a named volume docker creates an dedicated area for files to be stored in. This volume is mounted on the host so files can be read / written to at any time. This volume can be mounted into a container just like a bind mount. Named volumes exist outside the lifecycle of a specific container. 

Anonymous volumes are effectively the same as named volumes, but are linked to a specific container, and are deleted alongside the container that created them.

```sh
# Bind mount
$ docker run -v </path/on/host>:</path/in/container> <image_name>:<tag>

# Named volume
$ docker volume create volume_name
$ docker run -v <volume_name>:</path/in/container> <image_name>:<tag>

# Anonymous volume
$ docker run -v </path/in/container> <image_name>:<tag>
```

NB. If the mount directory in the container doesn't exist, docker will create it.

The mount point of a named volume on the host can be found using ```docker volume inspect <volume_name>```.

```sh
# Named volume example
$ docker volume create test-volume
$ docker volume inspect test-volume

[
    {
        "CreatedAt": "2021-03-05T10:32:10Z",
        "Driver": "local",
        "Labels": {},
        "Mountpoint": "/var/lib/docker/volumes/test-volume/_data",
        "Name": "test-volume",
        "Options": {},
        "Scope": "local"
    }
]

$ cd /var/lib/docker/volumes/test-volume/_data
# Volumes are owned by root, so we need to use sudo
$ sudo touch foo.txt
$ docker run --name test_container -it -v test-volume:/home/foo/bar ubuntu /bin/bash
# In the container
$ ls /home/foo/bar/
foo.txt 
$ touch /home/foo/bar/bob.txt
$ exit
# Back on the host
$ ls /var/lib/docker/volumes/test-volume/_data
foo.txt   bob.txt
```

On Windows hosts using WSL2, named volumes can be found mounted in the following directory:
```
\\wsl$\docker-desktop-data\version-pack-data\community\docker\volumes
```

### Setting a container to automatically restart
By default a container will not restart when the docker daemon loads, or when the container exits. There are several options to trigger the container to automatically restart.

```sh
# Always restart on daemon start or if the container exits
# Except don't restart if container is manually stopped
$ docker run --restart unless-stopped <image_name>:<tag>

# Always restart on daemon start or if the container stops for ANY reason
$ docker run --restart always <image_name>:<tag>
# To stop a container started with the above command:
$ docker update --restart=no <container_name>
$ docker stop <container_name>

# Restart on failure (container returns non-zero exit code)
# But don't restart on daemon start
$ docker run --restart on-failure <image_name>:<tag>
```

### Delete a container on exit
When testing it can be useful if containers are automatically deleted when they exit. This can be done with the ```--rm``` option. This should not be done in production as all the logs relating to why the container stopped will be deleted.

```sh
$ docker run --rm <image_name>:<tag>
```

## View docker containers
```sh
# Show all running containers
$ docker ps

# Show all running and stopped containers
docker ps -a
```

## Stopping and starting a container
A container can be stopped using:

```sh
$ docker stop <container_name>
```
This sends the SIGTERM signal. If the container doesn't stop within 10 seconds, a SIGKILL signal is sent.

Unless the container was run with the ```--rm``` option, the container is not deleted (even after a reboot) and can be restarted at anytime using:

```sh
# Start the container up
$ docker start <container_name>

# If the container was originally run with the -it argument
# then use the following command to reattach to the console
$ docker start -i <container_name>
```

## Logging
By default all output from a container's STDOUT and STDERR is stored to a log file stored on the host. This file persists across restarts of the container, and is removed when the container is deleted.

```sh
# View the logs for a container
$ docker logs <container_name>
```

By default Docker doesn't limit the maximum size of logs, so long running containers can have VERY large log files. A limit on both the maximum size of an individual log file, and the maximum number of log file for a container can be specified.

```sh
# Command format
$ docker run --log-opt max-size=<size> \
   --log-opt max-file=<max_number_of logs_files> <image_name>:<tag>
# Command example
$ docker run --log-opt max-size=10m --log-opt max-file=50 ubuntu
```

## Docker compose
To be added

## Building a Docker image
To be added
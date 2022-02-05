title: Using the Raspberry Pi Pico on Ubuntu
date: 2022/01/04
description: Instructions for programming the Raspberry Pi Pico in C/C++ using a Ubuntu development machine.
main_image: microcontroller.svg

## Install the Pico SDK
### Install prerequisites
```bash
sudo apt update
sudo apt install cmake gcc-arm-none-eabi libnewlib-arm-none-eabi build-essential libstdc++-arm-none-eabi-newlib
```

NB. Ubuntu 21.04 was used for this article, but the process should be the same for other recent versions of Ubuntu.

### Get the SDK 
```bash
# NB. SDK can be installed into any directory, this is just an example
mkdir -p  ~/pico
cd ~/pico/
git clone -b master https://github.com/raspberrypi/pico-sdk.git
cd pico-sdk
git submodule update --init
# Add SDK path to your environment
echo 'export PICO_SDK_PATH=$HOME/pico/pico-sdk' >> ~/.bashrc 
```

## Build and run examples
### LED Blink Example 
```bash
cd ~/pico
git clone -b master https://github.com/raspberrypi/pico-examples.git
cd pico-examples
mkdir build
cd build
cmake ..
cd blink
make -j $(nproc)
```

To run the blink firmware:

1. Hold the BOOTSEL button on the Raspberry Pi Pico, plug the USB connection on the Pico in to the development machine, then release the BOOTSEL button.
2. The Pico should appear as a mass storage device on the computer. Copy `~/pico/pico-examples/build/blink/blink.uf2` on to the mass storage device. 
3. The Pico should automatically reboot and run the `blink` firmware. The LED on the Pico board should start blinking.

### Hello World serial example
The Pico can use its USB port to provide a serial connection to the processor to allow for STDIO.

```bash
cd pico-examples/build/hello_world
make -j $(nproc)
```

To run the Hello, World example:

1. Hold the BOOTSEL button on the Raspberry Pi Pico, plug the USB connection on the Pico in to the development machine, then release the BOOTSEL button.
2. The Pico should appear as a mass storage device on the computer. Copy `~/pico/pico-examples/build/hello_world/usb/hello_usb.uf2` on to the mass storage device. 
3. The Pico will reboot and present to the development machine as a USB serial device. 
4. Use `sudo dmesg | tail` to identify the name of the serial port (Typically `/dev/ttyACM0`).
5. Connect to the serial port using screen `screen /dev/ttyACM0 115200`

The serial port should show:
```
Hello, world!
Hello, world!
Hello, world!
...
```
To disconnect from a terminal in screen use `Ctrl-A`, `k`, and `y`.

## Create your own project

```
cd ~/pico
mkdir my_project
cd my_project/
touch my_project.c
touch CMakeLists.txt
cp $PICO_SDK_PATH/external/pico_sdk_import.cmake .
```

In `my_project.c` add the following example:

```c
#include <stdio.h>
#include "pico/stdlib.h"
#include "hardware/gpio.h"
const uint LED_PIN = 25;

int main() {
    stdio_init_all();
    gpio_init(LED_PIN);
    gpio_set_dir(LED_PIN, GPIO_OUT);
    while (1) {
        gpio_put(LED_PIN, 0);
        sleep_ms(250);
        gpio_put(LED_PIN, 1);
        printf("Hello World\n");
        sleep_ms(1000);
    }
}
```

In `CMakeLists.txt` add the following text:
```
cmake_minimum_required(VERSION 3.13)

include(pico_sdk_import.cmake)

project(my_project C CXX ASM)

set(CMAKE_C_STANDARD 11)
set(CMAKE_CXX_STANDARD 17)

pico_sdk_init()

add_executable(my_project
  my_project.c
)

pico_enable_stdio_usb(my_project 1)
pico_enable_stdio_uart(my_project 0)

pico_add_extra_outputs(my_project)

target_link_libraries(my_project pico_stdlib)
```
NB. By default STDIO is connected to UART0 (Raspberry Pi Pico pins 1 and 2). `pico_enable_stdio_uart(my_project 0)` disables STDIO on UART0, and `pico_enable_stdio_usb(my_project 1)` enables STDIO via USB UART.

```bash
# Prepare for build
mkdir build
cd build
cmake ..
# Build/rebuild
make
```
To run the my_project firmware:

1. Hold the BOOTSEL button on the Raspberry Pi Pico, plug the USB connection on the Pico in to the development machine, then release the BOOTSEL button.
2. The Pico should appear as a mass storage device on the computer. Copy `~/pico/my_project/build/my_project.uf2` on to the mass storage device. 
3. The Pico will reboot and present to the development machine as a USB serial device, and the onboard LED will blink.

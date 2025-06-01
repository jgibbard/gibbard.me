title: Saleae Logic Analyzer - "Normal" trigger mode
date: 2025/06/01
description: A simple workaround to replicate the missing "Normal" trigger mode on Saleae Logic Analyzers - something standard on most oscilloscopes but strangely missing from Saleae's software.
main_image: graph.svg

Saleae Logic Analyzers currently omit the repeated “Normal” trigger mode found on virtually all oscilloscopes. I find this mode extremely useful in a variety of situations, and judging by the existing forum posts and feature requests on Saleae’s website, I’m not alone. While experimenting with the device, I discovered a simple workaround that replicates this functionality quite closely. I’ve made a short YouTube video demonstrating the method.

<iframe class="image_centred" width="560" height="315" src="https://www.youtube.com/embed/VVu-2U9KXYE?si=eWrblypbxbHxZis2" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>

<br>The workaround involves configuring the `Simple Parallel` analyzer on the channel you want to use as the edge trigger. Assign both the `D0` and `Clock` signals of the parallel bus to the same channel. Then choose either a rising or falling edge for the clock, depending on your desired trigger. For a rising edge trigger, set the `query` value to 1; for a falling edge, set it to 0. You can use the `holdoff` setting to avoid re-triggering too quickly - just like with a standard oscilloscope.

By including additional channels in the parallel bus, you can also configure edge-triggered events that are gated by specific logic conditions on other channels.

Note: This workaround only applies to digital channels.
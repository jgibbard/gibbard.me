title: Using OpenStreetMap Offline 
date: 2021/03/27
description: Setting up OpenStreetMap for use as part of an offline application can be a bit confusing. This article covers the full process.
main_image: map.svg

## Introduction
OpenStreetMap is a collaborative effort to create a free map of the world. It can be viewed online for free [here](https://www.openstreetmap.org){target="_blank}.

Maps of specific [continents](https://download.geofabrik.de/index.html){target="_blank} or even the entire [planet](https://planet.openstreetmap.org/){target="_blank} can easily be downloaded in [PBF format](https://wiki.openstreetmap.org/wiki/PBF_Format){target="_blank} for offline use. There is unfortunately a small catch; these data files provided by OpenStreetMap are actually a collection of data points and metadata that can be used to generate a map, and not a map itself.

When you view a map like google maps, it is rendered as series of image tiles that load dynamically as you zoom and pan around. A tile server is used to render and serve these images. Generating these images on the fly requires a lot of processing power, so typically the images are pre-rendered ahead of when they are needed and then cached. This means they can be served quickly allowing responsive panning and scrolling, however this is at the expense of requiring a lot of storage. Storing tiles for the entire planet at all standard zoom levels requires over 70 TBs of storage (as of March 2021).

When developing an application that needs to work offline on a computer with limited storage, the solution is to just cache the locations and zoom levels required. Caching tiles for the whole UK, at zoom levels up to a point where all but very minor roads are labeled (Zoom level 15), requires about 7 GB of data.

## Map tiles
Before moving on, it is worth knowing that the general term for a web based map that lets you zoom and pan is a [Slippy Map](https://wiki.openstreetmap.org/wiki/Slippy_map){target="_blank}.

Most slippy maps use 256 x 256 pixel map tiles. The area covered by a tile depends on the zoom level. At a zoom level of 0 the world is covered by a single tile. At a zoom level of 1 the world is covered by 4 tiles (2 x 2), at zoom level 2 it is covered by 16 tiles (4 x 4), and in general ```2^(2*z)``` tiles are required to cover the earth (where z is the zoom level). At each zoom level, each tile is given an X and Y coordinate, with X=0, Y=0 being the most north westerly tile. X increases from west to east, and Y from north to south.

It has become common that tile servers use the following URL format:

```
https://server.url.com/z/x/y.png
```

More information of slippy map tiles can be found [here](https://wiki.openstreetmap.org/wiki/Slippy_map_tilenames){target="_blank}

## Downloading Map Tiles
So how to you actually get the map tiles? Well one way would be to write a python script to iteratively download the tiles you want from OpenStreetMap's servers:
```
https://tile.openstreetmap.org/0/0/0.png
https://tile.openstreetmap.org/1/0/0.png
https://tile.openstreetmap.org/1/0/1.png
https://tile.openstreetmap.org/1/1/0.png
https://tile.openstreetmap.org/1/1/1.png
etc...
```
The problem with this is that OpenStreetMap is a not-for-profit organisation and does not have unlimited bandwidth. Given the size of the map tiles, this would quickly get very expensive for them. To stop people from doing this they use rate limiting and other techniques to prevent people just hammering their servers. 

To fill this niche several of commercial companies host their own tile servers, and charge for access to them. Most services offer a specific number of tile requests per month for a fixed fee. [Thunderforest](https://www.thunderforest.com/pricing/){target="_blank} is one example. If you intend to just use the account to do a one-off bulk download of a map for offline use, then make sure the plan you buy allows this.

## Rendering your own map tiles
Rendering your own map tiles gives you very fine grained control over what the end map looks like. The other big benefit is that it is free (minus the electricity and time required to do it)!

### Step 1 - Download the PBF file
The first step is to download the map data that you want to generate the map tiles from. 

Two common sources are:

 * [Official map of the entire planet](https://planet.openstreetmap.org/){target="_blank} 
 * [Map data for specific continents or countries](https://download.geofabrik.de/index.html){target="_blank}

For this example we will download the map of Great Britain.
```sh
mkdir ~/maps
cd maps
wget https://download.geofabrik.de/europe/great-britain-latest.osm.pbf
```

### Step 2 - Set up a tile server
Setting up a tile server is a relatively involved process, but fortunately [Alexander Overvoorde](https://while.io/){target="_blank} has made a [docker container](https://github.com/Overv/openstreetmap-tile-server){target="_blank} that has everything set up and ready to go!

First create a volume to store the map data:
```sh
docker volume create openstreetmap-data
```

Next run the tile server and import the map. Depending on the size of your PBF file and the speed of your computer, this may take a while (several hours).

**NOTE!!!** By default, place names are displayed in the language native to the country they are located in. If you want place names to be displayed in English where ever possible, then follow the instructions in [Appendix - Set up a tile server with English place names](#english) instead of the rest of this section.

```sh
# For the fastest possible import time, increase the number of threads to
# match what is available on your CPU.
# You can also adjust increase the amount of memory available to OSM2PGSQL.
docker run -v </full/path/to>/maps/great-britain-latest.osm.pbf:/data.osm.pbf \
           -v openstreetmap-data:/var/lib/postgresql/12/main \
           -e THREADS=2 \
           -e "OSM2PGSQL_EXTRA_ARGS=-C 4096" \
           overv/openstreetmap-tile-server:v1.6.0 import
```

Once the map has been imported you can run the tile server:
```sh
# Adjust the threads and memory as required
docker run -p 8080:80 \
           -v openstreetmap-data:/var/lib/postgresql/12/main -d \
           -e THREADS=2 \
           -e "OSM2PGSQL_EXTRA_ARGS=-C 4096" \
           --shm-size=256m \
           overv/openstreetmap-tile-server:v1.6.0 run
```

The tile server has a built in example webpage that lets you browse the map straight away. Go to http://localhost:8080 to see the map. It will take a little while to load initially.

Once the map loads, zoom in on the UK. Each time the map is panned or zoomed there will be a delay while the tiles are generated. The delay will depend on the speed of your computer.

### Step 3 - Pre-rendering part of the map {: #step3}
Rather than immediately using a python script to just download all the required tiles, I have found the fastest way to get an offline map is to use a pre-rendering script inside the docker container itself, and then to use python to download the tiles.

First we need to identify the area we want to render. [This](https://tools.geofabrik.de/calc/){target="_blank} website lets you draw a box anywhere in the world, and estimates the disk space required to store the tiles for various levels of zoom. Once you have selected the area you want go to the *CD* tab on the right hand side of the page and note the coordinates listed under "Osmosis Copy"

```python
left=-1.6 bottom=50.57 right=-1.05 top=50.78
```
Next, get a bash terminal inside the tile server docker container:
```sh
docker exec -it  <docker_container_name> /bin/bash
```

Then, once inside the docker container download a pre-rendering script and run it over the area you want to download.
```sh
# Run this Inside the docker container 
wget https://raw.githubusercontent.com/alx77/render_list_geo.pl/master/render_list_geo.pl
chmod +x render_list_geo.pl
#./render_list_geo.pl -x <left> -X <right> -y <bottom> -Y <top> \
#                     -z 0 -Z <max_zoom> -n <number_of_threads> -m ajt
# For example to render the Isle of Wight up to zoom level 15
./render_list_geo.pl -x -1.6 -X -1.05 -y 50.57 -Y 50.79 -z 0 -Z 15 -n 10 -m ajt
# Once it completes you can disconnect from the container
exit
```

### Step 4 - Download the tiles
I've written/adapted a small python script to download all tiles in a specific area from a tile server.

On the host computer (not inside the docker container) save the following script as *tile_download.py*.

```python
#!/usr/bin/python3
# tile_download.py
# Adapted from https://gist.github.com/tonyrewin/9444410 (tonyrewin)
import os
import math
import urllib.request
import os.path
import argparse

def deg2num(lat_deg, lon_deg, zoom):
    lat_rad = math.radians(lat_deg)
    n = 2.0 ** zoom
    xtile = int((lon_deg + 180.0) / 360.0 * n)
    ytile = int((1.0 - math.log(math.tan(lat_rad) + \
                (1 / math.cos(lat_rad))) / math.pi) / 2.0 * n)
    return (xtile, ytile)

def download_url(zoom, xtile, ytile):
    
    url = "http://localhost:8080/tile/%d/%d/%d.png" % (zoom, xtile, ytile)
    dir_path = "tiles/%d/%d/" % (zoom, xtile)
    download_path = "tiles/%d/%d/%d.png" % (zoom, xtile, ytile)
    
    if not os.path.exists(dir_path):
        os.makedirs(dir_path)
    
    if(not os.path.isfile(download_path)):
        urllib.request.urlretrieve(url, download_path)

if __name__ == "__main__":

    parser = argparse.ArgumentParser()
    parser.add_argument("-x", type=float, help="Minimum longitude")
    parser.add_argument("-X", type=float, help="Maximum longitude")
    parser.add_argument("-y", type=float, help="Minimum latitude")
    parser.add_argument("-Y", type=float, help="Minimum latitude")
    parser.add_argument("-Z", type=int, help="Maximum zoom level (>=7)")
    args = parser.parse_args()

    # Zoom 0 to 6 download worldwide tiles
    for zoom in range(0,7):
        for x in range(0,2**zoom):
            for y in range(0,2**zoom):
                download_url(zoom, x, y)

    for zoom in range(7, int(args.Z)+1):
        xtile_min, ytile_min = deg2num(float(args.y), float(args.x), zoom)
        xtile_max, ytile_max = deg2num(float(args.Y), float(args.X), zoom)

        print(f"Z:{zoom}, X:{xtile_min}-{xtile_max}, Y:{ytile_max}-{ytile_min}")
        for x in range(xtile_min, xtile_max + 1):
            for y in range(ytile_min, ytile_max - 1, -1):                
                result = download_url(zoom, x, y)    
```

Finally run the script using the same ```-x```, ```-X```, ```-y```, ```-Y```, and ```-Z``` values as used for the render_list_geo.pl script.

```sh
python3 tile_download.py -x -1.6 -X -1.05 -y 50.57 -Y 50.79 -Z 15
```

This will create a directory named *tiles* which will contain all the map tiles as PNG files. You can now host this tiles directory on your webserver, or use these tiles as part of an offline mapping application.

### Step 5 - Viewing the map tiles offline
One of the post popular ways of viewing the map tiles is to use the javascript library [Leaflet](https://leafletjs.com/download.html){target="_blank}. Leaflet is extremely easy to set up, you basically just need to point it to where your map is stored. 

To get a basic local web app working, make a new directory to hold the website's files, download leaflet, and move the *tiles* directory inside it:
```sh
mkdir website
cd website
# Get leaflet
wget http://cdn.leafletjs.com/leaflet/v1.7.1/leaflet.zip
unzip leaflet.zip
# Remove extra leaflet files (you may want to keep these in some cases)
rm leaflet.js.map leaflet.zip leaflet-src.esm.js leaflet-src.esm.js.map \
   leaflet-src.js leaflet-src.js.map
# Copy over the map tiles
mv ~/path/to/tiles .
```

Create an *index.html* file with the following content:
```html
<!doctype html>
<html lang="en">
    <head>
        <meta charset="utf-8">        
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Offline map example</title>
        <link rel="stylesheet" href="leaflet.css" />
        <script src="leaflet.js"></script>
    </head>
    <body>
        <h1>Hello, World!</h1>
        <div id="map" style="height: 500px; width: 800px; border: 1px solid #AAA;"></div>        
        <script type='text/javascript' src='map.js'></script>
    </body>
</html>
```

Create a *map.js* with the following content:
```javascript
// Centre the map on the Isle of Wight
var map = L.map( 'map', {
    center: [50.7, -1.3],
    minZoom: 2,
    maxZoom:15,
    zoom: 11
});

// This is optional, but restricts panning to the Isle of Wight.
let southWest = L.latLng(50.57, -1.6);
let northEast = L.latLng(50.79, -1.05);
let bounds = L.latLngBounds(southWest, northEast);
map.setMaxBounds(bounds);

// Add the downloaded tiles
L.tileLayer( 'tiles/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo( map );
```

You can use python to temporarily host the website locally:
```sh
python3 -m http.server
```
Go to http://localhost:8000 to see the local website.

You can see an example of what this should look like [here](test_map.html){target="_blank}. Note that I am only serving tiles for zoom level 10, 11, and 12.

**Note:** The if you have followed the instructions you currently have two tile servers running: the actual docker based tile server on port 8080, and the python static webserver on port 8000 hosting just the tiles that were rendered and downloaded. You can shut down the docker based tile server without effecting this python static webserver (See Step 6).

### Step 6 - Cleaning up (Optional)
The docker based tile server can use up a lot of drive space on your computer. It is a good idea to delete it once you have finished rendering and downloading tiles from it.

```sh
# Identify the name of the openstreetmap-tile-server container
docker ps -a
# Stop the container and delete all data (except the downloaded PNG tiles!)
docker stop <name_of_container>
docker rm <name_of_container>
docker volume rm openstreetmap-data
docker image rm overv/openstreetmap-tile-server:v1.6.0
```

### Appendix - Set up a tile server with English place names {: #english}
By default place names are displayed in the language native to the country they are located in. If you want place names to be displayed in English, then use the follow instructions instead of those in step 2.

To get this to work I forked the default OpenStreetMap CartoCSS map stylesheet [openstreetmap-carto](https://github.com/gravitystorm/openstreetmap-carto){target="_blank} and made a small modification to the ```project.mml``` file such that when the name of a place is grabbed from the map database it first checks if there is an English name, and if so uses that instead. I then created a fork of the [openstreetmap-tile-server](https://github.com/Overv/openstreetmap-tile-server){target="_blank} repo which contains the Dockerfile used to make the tile server. With this the only change I made was to point it to my fork of the openstreetmap-carto repo instead of the default one.

First build the new docker container:
```sh
# If you haven't already created a volume do it now:
docker volume create openstreetmap-data
# Pull down my slightly modified docker container
git clone https://github.com/jgibbard/openstreetmap-tile-server.git
cd openstreetmap-tile-server
# Build the docker container
docker build -t jg/openstreetmap-tile-server:v1.6.0_english_tags .
```

Next, import the map:
```sh
# For the fastest possible import time, increase the number of threads to
# match what is available on your CPU.
# You can also adjust increase the amount of memory available to OSM2PGSQL.
docker run -v </full/path/to/map>/<name_of_map>.osm.pbf:/data.osm.pbf \
           -v openstreetmap-data:/var/lib/postgresql/12/main \
           -e THREADS=2 \
           -e "OSM2PGSQL_EXTRA_ARGS=-C 4096" \
           jg/openstreetmap-tile-server:v1.6.0_english_tags import
```

Finally, once the map has been imported, you can run the tile server:
```sh
# Adjust the threads and memory as required
docker run -p 8080:80 \
           -v openstreetmap-data:/var/lib/postgresql/12/main -d \
           -e THREADS=2 \
           -e "OSM2PGSQL_EXTRA_ARGS=-C 4096" \
           --shm-size=256m \
           jg/openstreetmap-tile-server:v1.6.0_english_tags run
```

The tile server has a built in example webpage that lets you browse the map straight away. Go to http://localhost:8080 to see the map. It will take a little while to load initially.

Once the map loads, zoom in on the area you downloaded. Each time the map is panned or zoomed there will be a delay while the tiles are generated. The delay will depend on the speed of your computer.

Continue to [Step 3](#step3) above.
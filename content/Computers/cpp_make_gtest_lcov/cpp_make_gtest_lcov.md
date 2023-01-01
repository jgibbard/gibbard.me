title: Generating C++ code coverage metrics using GoogleTest and LCOV 
date: 2023/01/01
description: Understanding the code coverage of unit tests can be a useful metric in the software development process. This article contains a basic setup for outputting code coverage reports for GoogleTest unit tests. 
main_image: cpp_make_gtest_lcov.svg

## Prerequisites  
`LCOV` needs to be installed using: 
```bash
# CentOS / Redhat
sudo yum -y install lcov
# Debian / Ubuntu
sudo apt-get -y install lcov
```
## Example project layout
The example in this article uses a project layout as shown below:
```
project_dir
│   app.cpp
│   Makefile
├───src
│   └───app
│           coordinate.cpp
│           coordinate.hpp
│           coordinate2.cpp
│           coordinate2.hpp
└───test
        coordinate2_test.cpp
        coordinate_test.cpp
        main_test.cpp
```

## Example makefile
This makefile performs all the operations required to build, test, and generate coverage reports.

This makefile should be transferable to most basic C++ projects - just update the `TARGET`, `OBJFILES`, and `TESTOBJFILES` variables. For more complex projects the steps performed in the `coverage` section should still be very similar.

```make
TARGET = app
BUILD_DIR = build
SRC_DIR = src/$(TARGET)
LIB_DIR = lib
TEST_DIR = test
OBJFILES = coordinate.o coordinate2.o
TESTOBJFILES = coordinate_test.o coordinate2_test.o main_test.o
GIT_REPO = https://github.com

GTEST_LD = -L $(LIB_DIR)/googletest/build/googlemock/gtest/ -l gtest -l pthread
GTEST_INC_DIR = $(LIB_DIR)/googletest/googletest/include/
GTEST_DEP = $(LIB_DIR)/googletest/build/googlemock/gtest/libgtest.a

CXX = g++
CXXFLAGS = -g -Wall -std=c++11 -I ./src -I ./lib/inih -I $(GTEST_INC_DIR)

all: app tests

app: $(BUILD_DIR)/$(TARGET)

# Build Application
$(BUILD_DIR)/$(TARGET): $(OBJFILES:%.o=$(BUILD_DIR)/%.o) $(TARGET).cpp
	@mkdir -p $(BUILD_DIR)
	$(CXX) $(CXXFLAGS) $^ -o $(BUILD_DIR)/$(TARGET)

# Catch all rule for building objects
$(BUILD_DIR)/%.o : $(SRC_DIR)/%.cpp $(SRC_DIR)/%.hpp
	@mkdir -p $(BUILD_DIR)
	$(CXX) -c $(CXXFLAGS) $< -o $@

# Build Tests
tests: $(GTEST_DEP) $(BUILD_DIR)/test/$(TARGET)_test

$(BUILD_DIR)/test/$(TARGET)_test : $(TESTOBJFILES:%.o=$(BUILD_DIR)/test/%.o) $(OBJFILES:%.o=$(BUILD_DIR)/%.o)
	$(CXX) $(CXXFLAGS) $^ $(GTEST_LD) -o $(BUILD_DIR)/test/$(TARGET)_test 

# Catch all rules for building test objects
$(BUILD_DIR)/test/%_test.o: $(TEST_DIR)/%_test.cpp
	@mkdir -p $(BUILD_DIR)/test
	$(CXX) -c $(CXXFLAGS) $< -o $@

# Run tests
run_tests: tests
	$(BUILD_DIR)/test/$(TARGET)_test

$(GTEST_DEP) :
	@echo "Downloading googletest dependency..."
	@rm -rf $(LIB_DIR)/googletest
	@mkdir -p $(LIB_DIR)
	# Release 1.8.1 is the last version that works on CentOS 7
	cd $(LIB_DIR); git clone $(GIT_REPO)/google/googletest.git -b release-1.8.1
	cd $(LIB_DIR)/googletest; mkdir build; cd build; cmake3 ..; make;

coverage : CXXFLAGS += --coverage
coverage : clean run_tests
	@echo "Rebuild and run tests with coverage enabled"
	lcov --directory ./build/ --no-recursion -c -o app_coverage.info
	lcov --remove app_coverage.info "/usr*" -o app_coverage.info
	genhtml -o build/coverage/ -t "Application Coverage Report" --legend --num-spaces 4 app_coverage.info
	rm app_coverage.info
	make clean

clean:
	$(RM) $(BUILD_DIR)/$(TARGET) $(BUILD_DIR)/test/$(TARGET)_test $(BUILD_DIR)/*.o $(BUILD_DIR)/test/*.o
	$(RM) $(BUILD_DIR)/*.gcno $(BUILD_DIR)/*.gcda $(BUILD_DIR)/*/*.gcno $(BUILD_DIR)/*/*.gcda

clean_all: clean
	$(RM) -rf $(BUILD_DIR)
	$(RM) -rf $(LIB_DIR)

.PHONY: clean clean_all all tests app run_tests coverage 
```

Note that the version of GoogleTest is limited to 1.8.1 to ensure compatibility with CentOS 7 (C++11). The Makefile should still work if it is updated to use a newer version of GoogleTest and C++.

The following commands can be used: 
```bash
# Compile the application
make app
# Run all GoogleTest unit tests
make run_tests
# Build the project with coverage enabled, run the
# unit tests, generate coverage reports, and clean up.
make coverage
```

Note that `make coverage` first performs a clean build. This is because generating coverage reports requires the code to be compiled with the gcc ```--coverage``` option which is not used for the default build.

The after running `make coverage` the coverage report is located as an HTML webpage in `build/coverage/`

## Example project files
The following files are just included as a reference of a working example project for the above Makefile. Two classes are included (actually two copies of the same class but with different names). One class has 100% unit test coverage and the other has partial coverage. Note that this code doesn't do anything useful!

### app.cpp
```c++
#include <iostream>
#include <string>
#include <app/coordinate.hpp>

int main(int argc, char **argv) {

    Coordinate x(0.100, -80.0);

    return EXIT_SUCCESS;
}
```
### src/app/coordinate.cpp
```c++
#include <stdexcept>
#include <app/coordinate.hpp>

Coordinate::Coordinate(double lat, double lng) : lat(lat), lng(lng) {
    if (lat > 90.0 || lat < -90.0 || lng > 180.0 || lng < -180.0) {
        throw std::runtime_error("ERROR: Failed to parse coordinate coordinate. Value out of range");
    }
}

bool Coordinate::operator==(const Coordinate &other) const {
    return (lat == other.lat && lng == other.lng);
}

bool Coordinate::operator!=(const Coordinate &other) const {
    return !(*this == other);
}

void Coordinate::Offset(const Coordinate &other) {
    lat += other.lat;
    lng += other.lng;
}
```
### src/app/coordinate.hpp
```c++
#pragma once

class Coordinate {
    private:      

    public:
        Coordinate(double lat, double lng);
        bool operator==(const Coordinate &other) const;
        bool operator!=(const Coordinate &other) const;
        void Offset(const Coordinate &other);
        double lat;
        double lng;
};
```
### src/app/coordinate2.cpp
Note that the ```Coordinate2``` class is just a renamed duplicate of the ```Coordinate``` class.
```c++
#include <stdexcept>
#include <app/coordinate2.hpp>

Coordinate2::Coordinate2(double lat, double lng) : lat(lat), lng(lng) {
    if (lat > 90.0 || lat < -90.0 || lng > 180.0 || lng < -180.0) {
        throw std::runtime_error("ERROR: Failed to parse coordinate coordinate. Value out of range");
    }
}

bool Coordinate2::operator==(const Coordinate2 &other) const {
    return (lat == other.lat && lng == other.lng);
}

bool Coordinate2::operator!=(const Coordinate2 &other) const {
    return !(*this == other);
}

void Coordinate2::Offset(const Coordinate2 &other) {
    lat += other.lat;
    lng += other.lng;
}
```
### src/app/coordinate2.hpp
```c++
#pragma once

class Coordinate2 {
    private:      

    public:
        Coordinate2(double lat, double lng);
        bool operator==(const Coordinate2 &other) const;
        bool operator!=(const Coordinate2 &other) const;
        void Offset(const Coordinate2 &other);
        double lat;
        double lng;
};
```

### test/main_test.cpp
```c++
#include <gtest/gtest.h>

int main(int argc, char **argv) {
    ::testing::InitGoogleTest(&argc, argv); 
    return RUN_ALL_TESTS();
}
```

### test/coordinate_test.cpp
Note: Basic unit tests cover all methods in the `Coordinate` class.
```c++
#include <gtest/gtest.h>
#include <app/coordinate.hpp>

TEST(Coordinate, DoubleConstrutor) {
    Coordinate coordinate = Coordinate(-43.454,89.0454);
    EXPECT_DOUBLE_EQ(-43.454, coordinate.lat);
    EXPECT_DOUBLE_EQ(89.0454, coordinate.lng);
}

TEST(Coordinate, DoubleConstrutorOutOfRange) {

    EXPECT_THROW({
        Coordinate coordinate = Coordinate(90.100,50.0);    
    }, std::runtime_error);    

    EXPECT_THROW({
        Coordinate coordinate = Coordinate(-90.1,50.0);    
    }, std::runtime_error);

    EXPECT_THROW({
        Coordinate coordinate = Coordinate(45.0,180.1);    
    }, std::runtime_error); 

    EXPECT_THROW({
        Coordinate coordinate = Coordinate(45.0,-180.1);    
    }, std::runtime_error); 
}

TEST(Coordinate, EqualOverload) {
    Coordinate a = Coordinate(10.1,-34.2);
    Coordinate b = Coordinate(10.1,-34.2);    
    Coordinate c = Coordinate(10.1,34.2);
    EXPECT_TRUE(a == b);
    EXPECT_FALSE(a == c);
}

TEST(Coordinate, NotEqualOverload) {
    Coordinate a = Coordinate(-48.0,90.0);
    Coordinate b = Coordinate(-48.0,90.0);
    Coordinate c = Coordinate(10.1,34.2);
    EXPECT_FALSE(a != b);   
    EXPECT_TRUE(a != c);
}

TEST(Coordinate, OffsetValid) {
    Coordinate a = Coordinate(10.0,-10.0);
    Coordinate b = Coordinate(0.1, 0.2);
    
    a.Offset(b);
    EXPECT_DOUBLE_EQ(10.1, a.lat);
    EXPECT_DOUBLE_EQ(-9.8, a.lng);    
}
```

### test/coordinate2_test.cpp
Note: no unit test for the `Offset` method in the `Coordinate2` class.
```c++
#include <gtest/gtest.h>
#include <app/coordinate2.hpp>

TEST(Coordinate2, DoubleConstrutor) {
    Coordinate2 coordinate = Coordinate2(-43.454,89.0454);
    EXPECT_DOUBLE_EQ(-43.454, coordinate.lat);
    EXPECT_DOUBLE_EQ(89.0454, coordinate.lng);
}

TEST(Coordinate2, DoubleConstrutorOutOfRange) {

    EXPECT_THROW({
        Coordinate2 coordinate = Coordinate2(90.100,50.0);    
    }, std::runtime_error);    

    EXPECT_THROW({
        Coordinate2 coordinate = Coordinate2(-90.1,50.0);    
    }, std::runtime_error);

    EXPECT_THROW({
        Coordinate2 coordinate = Coordinate2(45.0,180.1);    
    }, std::runtime_error); 

    EXPECT_THROW({
        Coordinate2 coordinate = Coordinate2(45.0,-180.1);    
    }, std::runtime_error); 
}

TEST(Coordinate2, EqualOverload) {
    Coordinate2 a = Coordinate2(10.1,-34.2);
    Coordinate2 b = Coordinate2(10.1,-34.2);    
    Coordinate2 c = Coordinate2(10.1,34.2);
    EXPECT_TRUE(a == b);
    EXPECT_FALSE(a == c);
}

TEST(Coordinate2, NotEqualOverload) {
    Coordinate2 a = Coordinate2(-48.0,90.0);
    Coordinate2 b = Coordinate2(-48.0,90.0);
    Coordinate2 c = Coordinate2(10.1,34.2);
    EXPECT_FALSE(a != b);   
    EXPECT_TRUE(a != c);
}
```
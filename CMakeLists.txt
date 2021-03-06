cmake_minimum_required(VERSION 2.8)
project(tracer)

set(CMAKE_CXX_STANDARD 11)
set(CMAKE_CXX_STANDARD_REQUIRED on)
set(CMAKE_CXX_EXTENSIONS off)

set(FLAGS "-Wall -Wextra -pedantic")
set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} ${FLAGS}")

set(EXECUTABLE_OUTPUT_PATH ${CMAKE_SOURCE_DIR}/bin)

set(TRACER ${PROJECT_NAME})

file(GLOB_RECURSE SRC src/*.cpp)
add_executable(${TRACER} ${SRC})

if(WIN32)
    set(SFML_ROOT ${CMAKE_SOURCE_DIR}/../SFML)
else()
    set(SFML_ROOT /usr/local/share/SFML)
endif()

set(CMAKE_MODULE_PATH ${CMAKE_MODULE_PATH};${SFML_ROOT}/cmake/Modules)

find_package(SFML 2
    COMPONENTS
        graphics
        window
        system
    REQUIRED
)

target_include_directories(${TRACER}
    PRIVATE ${SFML_INCLUDE_DIR}
)

target_link_libraries(${TRACER}
    PRIVATE sfml-graphics
    PRIVATE sfml-window
    PRIVATE sfml-system
    PRIVATE ${SFML_DEPENDENCIES}
)

target_compile_definitions(${TRACER}
    PRIVATE GLM_ENABLE_EXPERIMENTAL
    )

if(WIN32)
    file(GLOB SFML_DLLS ${SFML_ROOT}/bin/*.dll)

    add_custom_command(TARGET ${TRACER} POST_BUILD
        COMMAND ${CMAKE_COMMAND} -E copy_if_different
        ${SFML_DLLS}
        $<TARGET_FILE_DIR:${TRACER}>
    )
endif()

include_directories(../glm)

#set(CMAKE_BUILD_TYPE Debug)
set(CMAKE_BUILD_TYPE Release)

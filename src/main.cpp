#include <SFML/Graphics.hpp>

#include <glm/glm.hpp>
#include <glm/gtc/type_ptr.hpp>
#include <glm/gtx/transform.hpp>

int main(int, char **) {
    const char *windowTitle = "TRACER";

    const float windowDownscale = 1.5;

    const int windowWidth = sf::VideoMode::getDesktopMode().width / windowDownscale;
    const int windowHeight = sf::VideoMode::getDesktopMode().height / windowDownscale;

    bool isFullscreen = false;
    sf::VideoMode videoMode(windowWidth, windowHeight);
    sf::Vector2i windowPos;

    sf::RenderWindow window(videoMode, windowTitle, sf::Style::Default);
    windowPos = window.getPosition();

    sf::RenderTexture image;

    auto reinitializeWindow = [&](sf::VideoMode videoMode, sf::Uint32 style) {
        window.create(videoMode, windowTitle, style);
        image.create(videoMode.width, videoMode.height);

        window.setMouseCursorGrabbed(true);
        window.setMouseCursorVisible(false);
    };

    reinitializeWindow(videoMode, sf::Style::Default);

    sf::Shader imageShader;
    imageShader.loadFromFile("src/image.frag", sf::Shader::Fragment);

    sf::Shader postfxShader;
    postfxShader.loadFromFile("src/postfx.frag", sf::Shader::Fragment);

    static const glm::vec4 defaultCameraOffset = glm::vec4(0, 2, 0, 0);

    glm::vec2 cameraAngles;
    glm::vec4 cameraOffset = defaultCameraOffset;
    glm::mat4 cam_extr, cameraRotation;
    glm::mat3 cam_intr;
    bool updateCamera = true;

    float u_x0 = 0, u_y0 = 0, u_fx = 1, u_fy = 1, u_s = 0;

    while (window.isOpen()) {
        sf::Vector2i fixedCursosPos = sf::Vector2i(window.getSize() / 2u);

        sf::Event event;

        while (window.pollEvent(event))
            switch (event.type) {
            case sf::Event::Closed:
                window.close();
                break;

            case sf::Event::KeyPressed:
                switch (event.key.code) {
                case sf::Keyboard::Escape:
                    if (isFullscreen) {
                        reinitializeWindow(videoMode, sf::Style::Default);
                        window.setPosition(windowPos);
                        isFullscreen = false;
                    } else
                        window.close();

                    break;

                case sf::Keyboard::F11:
                case sf::Keyboard::F:
                    if (isFullscreen) {
                        reinitializeWindow(videoMode, sf::Style::Default);
                        window.setPosition(windowPos);
                    } else
                        reinitializeWindow(sf::VideoMode::getDesktopMode(), sf::Style::Fullscreen);

                    isFullscreen = !isFullscreen;
                    break;

                case sf::Keyboard::R:
                    cameraAngles = glm::vec2();
                    cameraRotation = glm::mat4(1.f);
                    cameraOffset = defaultCameraOffset;

                    u_x0 = u_y0 = u_s = 0;
                    u_fx = u_fy = 1;

                    updateCamera = true;
                    break;

                case sf::Keyboard::Q:
                    if (sf::Keyboard::isKeyPressed(sf::Keyboard::LControl))
                        u_fx /= 1.1;
                    else
                        u_fx *= 1.1;

                    updateCamera = true;
                    break;

                case sf::Keyboard::E:
                    if (sf::Keyboard::isKeyPressed(sf::Keyboard::LControl))
                        u_fy /= 1.1;
                    else
                        u_fy *= 1.1;

                    updateCamera = true;
                    break;

                case sf::Keyboard::I:
                    u_y0 -= 0.1;
                    updateCamera = true;
                    break;

                case sf::Keyboard::J:
                    u_x0 += 0.1;
                    updateCamera = true;
                    break;

                case sf::Keyboard::K:
                    u_y0 += 0.1;
                    updateCamera = true;
                    break;

                case sf::Keyboard::L:
                    u_x0 -= 0.1;
                    updateCamera = true;
                    break;

                case sf::Keyboard::Z:
                    u_s -= 0.1;
                    updateCamera = true;
                    break;

                case sf::Keyboard::X:
                    u_s += 0.1;
                    updateCamera = true;
                    break;

                default:
                    break;
                }

                break;

            case sf::Event::MouseWheelScrolled:
                if (event.mouseWheelScroll.delta > 0) {
                    u_fx *= 1.1;
                    u_fy *= 1.1;
                } else {
                    u_fx /= 1.1;
                    u_fy /= 1.1;
                }

                updateCamera = true;
                break;

            case sf::Event::Resized: {
                windowPos = window.getPosition();
                videoMode = sf::VideoMode(event.size.width, event.size.height);
                reinitializeWindow(videoMode, sf::Style::Default);
                break;
            }

            case sf::Event::GainedFocus:
                sf::Mouse::setPosition(sf::Vector2i(fixedCursosPos));
                break;

            default:
                break;
            }

        if (window.hasFocus()) {
            sf::Vector2i delta = fixedCursosPos - sf::Mouse::getPosition();
            sf::Mouse::setPosition(fixedCursosPos);

            if (delta.x != 0 || delta.y != 0) {
                cameraAngles += glm::vec2(delta.x, delta.y) / 200.f;

                cameraRotation = glm::rotate(glm::mat4(1.f), cameraAngles.x, glm::vec3(0.f, -1.f, 0.f));
                cameraRotation = glm::rotate(cameraRotation, cameraAngles.y, glm::vec3(-1.f, 0.f, 0.f));

                updateCamera = true;
            }

            float step = sf::Keyboard::isKeyPressed(sf::Keyboard::LShift) ? 0.05f : 0.01f;

            if (sf::Keyboard::isKeyPressed(sf::Keyboard::W) || sf::Keyboard::isKeyPressed(sf::Keyboard::S)) {
                static const glm::vec4 forward = glm::vec4(0, 0, 1, 0);
                glm::vec4 dir = cameraRotation * forward * step;

                if (sf::Keyboard::isKeyPressed(sf::Keyboard::W))
                    cameraOffset += dir;
                if (sf::Keyboard::isKeyPressed(sf::Keyboard::S))
                    cameraOffset -= dir;

                updateCamera = true;
            }

            if (sf::Keyboard::isKeyPressed(sf::Keyboard::D) || sf::Keyboard::isKeyPressed(sf::Keyboard::A)) {
                static const glm::vec4 right = glm::vec4(1, 0, 0, 0);
                glm::vec4 dir = cameraRotation * right * step;

                if (sf::Keyboard::isKeyPressed(sf::Keyboard::D))
                    cameraOffset += dir;
                if (sf::Keyboard::isKeyPressed(sf::Keyboard::A))
                    cameraOffset -= dir;

                updateCamera = true;
            }

            if (sf::Keyboard::isKeyPressed(sf::Keyboard::Space) || sf::Keyboard::isKeyPressed(sf::Keyboard::C)) {
                static const glm::vec4 up = glm::vec4(0, 1, 0, 0);
                glm::vec4 dir = up * step;

                if (sf::Keyboard::isKeyPressed(sf::Keyboard::Space))
                    cameraOffset += dir;
                if (sf::Keyboard::isKeyPressed(sf::Keyboard::C))
                    cameraOffset -= dir;

                updateCamera = true;
            }

            if (updateCamera) {
                cam_extr = glm::translate(glm::mat4(1.f), glm::vec3(cameraOffset));
                cam_extr *= cameraRotation;

                glm::mat3 intr_translate(1, 0, 0,
                                         0, 1, 0,
                                         u_x0, u_y0, 1);

                glm::mat3 intr_scale(u_fx, 0, 0,
                                     0, u_fy, 0,
                                     0, 0, 1);

                glm::mat3 intr_shear(1, 0, 0,
                                     u_s / u_fx, 1, 0,
                                     0, 0, 1);

                cam_intr = glm::inverse(intr_translate * intr_scale * intr_shear);

                updateCamera = false;
            }
        }

        sf::RenderStates states;
        states.shader = &imageShader;

        imageShader.setUniform("resolution", sf::Glsl::Vec2(window.getSize()));
        imageShader.setUniform("cam_extr", sf::Glsl::Mat4(glm::value_ptr(cam_extr)));
        imageShader.setUniform("cam_intr", sf::Glsl::Mat3(glm::value_ptr(cam_intr)));

        sf::RectangleShape rect(window.getView().getSize());
        image.draw(rect, states);

        image.display();

        states.shader = &postfxShader;

        postfxShader.setUniform("resolution", sf::Glsl::Vec2(window.getSize()));
        postfxShader.setUniform("image", image.getTexture());

        window.draw(rect, states);

        window.display();
    }

    return 0;
}

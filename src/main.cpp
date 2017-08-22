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

    sf::Vector2f cameraAngles;
    glm::vec4 cameraOffset;

    while (window.isOpen()) {
        sf::Vector2f fixedCursosPos = sf::Vector2f(window.getSize() / 2u);

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
                    cameraAngles = sf::Vector2f();
                    cameraOffset = glm::vec4();
                    break;

                default:
                    break;
                }

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

        sf::Vector2f delta = fixedCursosPos - sf::Vector2f(sf::Mouse::getPosition());
        delta /= 200.f;

        if (window.hasFocus()) {
            sf::Mouse::setPosition(sf::Vector2i(fixedCursosPos));

            cameraAngles += delta;
        }

        glm::mat4 cam_r = glm::rotate(glm::mat4(1.f), cameraAngles.x, glm::vec3(0.f, -1.f, 0.f));
        cam_r = glm::rotate(cam_r, -cameraAngles.y, glm::vec3(1.f, 0.f, 0.f));

        static const glm::vec4 forward = glm::vec4(0, 0, 1, 0);
        static const glm::vec4 right = glm::vec4(1, 0, 0, 0);
        static const glm::vec4 up = glm::vec4(0, 1, 0, 0);

        float step = sf::Keyboard::isKeyPressed(sf::Keyboard::LShift) ? 0.005f : 0.001f;

        if (window.hasFocus()) {
            if (sf::Keyboard::isKeyPressed(sf::Keyboard::W))
                cameraOffset += cam_r * (forward * step);
            if (sf::Keyboard::isKeyPressed(sf::Keyboard::S))
                cameraOffset -= cam_r * (forward * step);
            if (sf::Keyboard::isKeyPressed(sf::Keyboard::D))
                cameraOffset += cam_r * (right * step);
            if (sf::Keyboard::isKeyPressed(sf::Keyboard::A))
                cameraOffset -= cam_r * (right * step);
            if (sf::Keyboard::isKeyPressed(sf::Keyboard::Space))
                cameraOffset += up * step;
            if (sf::Keyboard::isKeyPressed(sf::Keyboard::C))
                cameraOffset -= up * step;
        }

        glm::mat4 cam_t = glm::translate(glm::mat4(1.f), glm::vec3(cameraOffset));

        sf::RenderStates states;
        states.shader = &imageShader;

        imageShader.setUniform("resolution", sf::Glsl::Vec2(window.getSize()));

        imageShader.setUniform("cam_t", sf::Glsl::Mat4(glm::value_ptr(cam_t)));
        imageShader.setUniform("cam_r", sf::Glsl::Mat4(glm::value_ptr(cam_r)));

        sf::RectangleShape rect(window.getView().getSize());
        image.draw(rect, states);

        image.display();

        window.clear();

        states.shader = &postfxShader;

        postfxShader.setUniform("resolution", sf::Glsl::Vec2(window.getSize()));
        postfxShader.setUniform("image", image.getTexture());

        window.draw(rect, states);

        window.display();
    }

    return 0;
}

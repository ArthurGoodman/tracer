#include <SFML/Graphics.hpp>

int main(int, char **) {
    const char *windowTitle = "TRACER";

    const float windowDownscale = 1.5;

    const int windowWidth = sf::VideoMode::getDesktopMode().width / windowDownscale;
    const int windowHeight = sf::VideoMode::getDesktopMode().height / windowDownscale;

    sf::Vector2i mousePos;

    bool isFullscreen = false;
    sf::VideoMode videoMode(windowWidth, windowHeight);
    sf::Vector2i windowPos;

    sf::RenderWindow window(videoMode, windowTitle, sf::Style::Default);
    windowPos = window.getPosition();

    sf::RenderTexture image;
    if (!image.create(videoMode.width, videoMode.height))
        return -1;

    sf::Shader imageShader;
    imageShader.loadFromFile("src/image.frag", sf::Shader::Fragment);

    sf::Shader postfxShader;
    postfxShader.loadFromFile("src/postfx.frag", sf::Shader::Fragment);

    while (window.isOpen()) {
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
                        window.create(videoMode, windowTitle, sf::Style::Default);
                        image.create(videoMode.width, videoMode.height);
                        window.setPosition(windowPos);
                        isFullscreen = false;
                    } else
                        window.close();

                    break;

                case sf::Keyboard::F11:
                case sf::Keyboard::F:
                    if (isFullscreen) {
                        window.create(videoMode, windowTitle, sf::Style::Default);
                        image.create(videoMode.width, videoMode.height);
                        window.setPosition(windowPos);
                    } else {
                        windowPos = window.getPosition();
                        window.create(sf::VideoMode::getDesktopMode(), windowTitle, sf::Style::Fullscreen);
                        image.create(sf::VideoMode::getDesktopMode().width, sf::VideoMode::getDesktopMode().height);
                    }

                    isFullscreen = !isFullscreen;
                    break;

                default:
                    break;
                }

                break;

            case sf::Event::MouseButtonPressed:
                mousePos = sf::Vector2i(event.mouseButton.x, event.mouseButton.y);
                break;

            case sf::Event::MouseMoved:
                mousePos = sf::Vector2i(event.mouseMove.x, event.mouseMove.y);
                break;

            case sf::Event::Resized: {
                videoMode = sf::VideoMode(event.size.width, event.size.height);
                sf::Vector2i pos = window.getPosition();
                window.create(videoMode, windowTitle, sf::Style::Default);
                window.setPosition(pos);
                break;
            }

            default:
                break;
            }

        sf::RenderStates states;
        states.shader = &imageShader;

        imageShader.setUniform("resolution", sf::Glsl::Vec2(window.getSize()));

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

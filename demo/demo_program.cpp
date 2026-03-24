#include <iostream>
#include <string>

int factorial(int n) {
    int result = 1;
    for (int i = 2; i <= n; i++) {
        result *= i;
    }
    return result;
}

int main() {
    int x = 5;
    int y = 10;
    int sum = x + y;

    std::string message = "Hello";

    for (int i = 0; i < 3; i++) {
        sum += i;
    }

    int fact = factorial(x);

    if (fact > 100) {
        std::cout << "Factorial is large: " << fact << std::endl;
    } else {
        std::cout << "Factorial is small: " << fact << std::endl;
    }

    std::cout << "Sum: " << sum << ", Message: " << message << std::endl;

    return 0;
}

#include <stdio.h>

int main() {
    int sum = 0;
    int i;

    for (i = 1; i <= 5; i++) {
        sum += i;
    }

    if (sum > 10) {
        printf("Sum is large: %d\n", sum);
    } else {
        printf("Sum is small: %d\n", sum);
    }

    return 0;
}

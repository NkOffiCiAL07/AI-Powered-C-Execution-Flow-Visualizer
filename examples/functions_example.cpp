#include <iostream>
#include <vector>

int square(int value) {
    int result = value * value;
    return result;
}

int weighted_sum(const std::vector<int>& values) {
    int total = 0;
    for (int index = 0; index < static_cast<int>(values.size()); ++index) {
        int contribution = square(values[index]) + index;
        total += contribution;
    }
    return total;
}

int adjust_score(int base, int bonus) {
    int adjusted = base + bonus;
    if (adjusted % 2 == 0) {
        adjusted += 3;
    } else {
        adjusted -= 1;
    }
    return adjusted;
}

int main() {
    std::vector<int> numbers = {2, 3, 4};
    int sum = weighted_sum(numbers);
    int bonus = square(5);
    int final_score = adjust_score(sum, bonus);

    std::cout << "Final score: " << final_score << std::endl;
    return 0;
}

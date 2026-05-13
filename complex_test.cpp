#include <iostream>
#include <string>
#include <vector>

using namespace std;

int fibonacci(int n) {
    if (n <= 1) {
        return n;
    }

    int first = 0;
    int second = 1;
    for (int i = 2; i <= n; i++) {
        int next = first + second;
        first = second;
        second = next;
    }
    return second;
}

int main() {
    vector<int> values = {2, 4, 6};
    int total = 0;
    string label = "start";

    for (int index = 0; index < values.size(); index++) {
        int current = values[index];
        int fib = fibonacci(current);
        total += fib;

        if (fib % 2 == 0) {
            label = "even";
        } else {
            label = "odd";
        }

        cout << "value=" << current << ", fib=" << fib << ", label=" << label << endl;
    }

    cout << "total=" << total << endl;
    return 0;
}

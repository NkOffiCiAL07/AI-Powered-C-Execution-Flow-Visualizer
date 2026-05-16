#include <iostream>
#include <vector>
struct Node { int id; };
int main() {
    std::vector<int> v = {1, 2, 3};
    Node n = {42};
    Node* p = &n;
    return 0;
}

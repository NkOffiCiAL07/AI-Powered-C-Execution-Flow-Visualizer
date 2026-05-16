import re
lines = [
    "0x000000016fdfeea0: (std::vector<int>) v = size=3 {",
    "0x00000001006106a0:   (int) [0] = 1",
    "0x00000001006106a4:   (int) [1] = 2",
    "}",
    "0x000000016fdfee8c: (Node) n = {",
    "0x000000016fdfee8c:   (int) id = 42",
    "}",
    "0x000000016fdfee80: (Node *) p = 0x000000016fdfee8c"
]

variables = {}
memory = []
current_var = None
current_val = []

for line in lines:
    line = line.strip()
    match = re.match(r"^([0-9a-fA-Fx]+|[a-z0-9]+):\s+\((.*?)\)\s+(.+?)\s*=\s*(.*)$", line)
    if match:
        addr, typ, name, val = match.groups()
        if not name.startswith("[") and not current_var:
            current_var = name
            current_val = [val]
            memory.append({"address": addr, "type": typ, "name": name, "value": val})
        elif current_var:
            current_val.append(line)
            memory.append({"address": addr, "type": typ, "name": name, "value": val})
    elif line == "}" and current_var:
        current_val.append("}")
        variables[current_var] = "\n".join(current_val)
        current_var = None
        current_val = []
    elif current_var:
        current_val.append(line)
        
    if match and not val.endswith("{") and not current_var:
        variables[name] = val

print("VARS:", variables)
print("MEM:", memory)

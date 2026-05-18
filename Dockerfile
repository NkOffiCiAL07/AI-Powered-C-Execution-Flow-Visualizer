FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# System compilers + debugger + Java
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 python3-pip \
    gcc g++ \
    clang lldb \
    default-jdk \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip3 install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["python3", "run_server.py"]

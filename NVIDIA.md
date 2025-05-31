Here's a **step-by-step guide** based on your instructions to **install NVIDIA driver 535 and enable GPU support in Docker** (including notes for Ubuntu 24.04 users):

---

## ✅ Step 1: Install NVIDIA Driver

```bash
sudo apt update
sudo apt install nvidia-driver-535 -y
sudo reboot
```

Wait for reboot and confirm with:

```bash
nvidia-smi
```

You should see the driver and GPU information.

---

## ✅ Step 2: Set Up NVIDIA Container Toolkit Repository

### For **Ubuntu 24.04**, use the **Ubuntu 22.04** list due to unavailability (as of now):

```bash
distribution=ubuntu22.04
```

Add GPG key and source list:

```bash
curl -s -L https://nvidia.github.io/libnvidia-container/gpgkey | \
  sudo gpg --dearmor -o /usr/share/keyrings/nvidia-container-toolkit-keyring.gpg

curl -s -L https://nvidia.github.io/libnvidia-container/$distribution/libnvidia-container.list | \
  sed 's#deb https://#deb [signed-by=/usr/share/keyrings/nvidia-container-toolkit-keyring.gpg] https://#' | \
  sudo tee /etc/apt/sources.list.d/nvidia-container-toolkit.list
```

---

## ✅ Step 3: Install NVIDIA Container Toolkit

```bash
sudo apt update
sudo apt install -y nvidia-container-toolkit
```

---

## ✅ Step 4: Configure Docker to Use NVIDIA Runtime

```bash
sudo nvidia-ctk runtime configure --runtime=docker
sudo systemctl restart docker
```

---

## ✅ Step 5: Test Docker with GPU

Run the following:

```bash
docker run --rm --gpus all nvidia/cuda:12.2.0-base-ubuntu22.04 nvidia-smi
```

You should see GPU usage inside the container. If this command works, your Docker is properly set up to use the GPU.

---

## 🧠 Notes

* If you're using **Podman** or a **Kubernetes setup**, the process differs slightly.
* If `nvidia-smi` fails, check your secure boot (it might block kernel modules).
* For CUDA development, you may also want to install the `cuda-toolkit`.

Let me know if you want help enabling GPU in WSL2, Kubernetes, or using TensorFlow/PyTorch in Docker.

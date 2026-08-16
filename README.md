# ShrimpScan: YOLO11-Based WSSV Detection System

---

## 📌 Project Overview
**ShrimpScan** is a computer vision-based diagnostic system developed to detect and localize **White Spot Syndrome Virus (WSSV)** in shrimp. WSSV is a highly contagious and lethal viral pathogen affecting aquaculture worldwide. By leveraging the **YOLO11** object detection architecture coupled with an intuitive web interface, this project provides a rapid, automated, and non-invasive alternative to traditional laboratory testing methods, optimized for edge-device deployment.

---

## 🔬 Tech Stack
* **Frontend:** React.js, JavaScript, HTML5, CSS3
* **Deep Learning Framework:** YOLO11 (`ultralytics`)
* **Backend & Scripting:** Python 3.9+
* **Model Optimization & Edge Inference:** ONNX Runtime, Tencent NCNN Framework
* **Computer Vision & Image Processing:** OpenCV, NumPy, Pillow

---

## 📊 Methodology Summary
1. **Dataset Acquisition & Preprocessing:** Collection and cleaning of high-resolution image samples representing healthy and WSSV-infected shrimp.
2. **Annotation & Augmentation:** Dataset labeling and augmentation (photometric and geometric transforms) to enhance model robustness under varying lighting and water conditions.
3. **Model Training & Evaluation:** Training and fine-tuning YOLO11 models for accurate bounding box detection and symptom localization.
4. **Export & Edge Optimization:** Converting trained `.pt` weights into **ONNX** and **NCNN** formats to facilitate lightweight, low-latency inference.
5. **Web Application Integration:** Building a **React.js** frontend to enable seamless image/video uploads, real-time diagnostic visualization, and detection metric reporting.

---

## 👥 Authors & Acknowledgments
* **Thesis Proponents:** Undergraduate Thesis Study
* **Acknowledgments:** Special thanks to our thesis advisers, panel members, and aquaculture partners for providing guidance, resources, and domain expertise.

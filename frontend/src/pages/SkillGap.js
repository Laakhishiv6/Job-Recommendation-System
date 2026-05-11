import React, { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import api from "../utils/api";

// ── Curated phase-by-phase roadmaps per technology ────────────────────────
// Every resource URL is a direct link to the exact course / doc page.
// Resources with `search` generate a YouTube search (only used for uncurated default).
const SKILL_ROADMAPS = {
  python: {
    phases: [
      { phase: "Foundations", duration: "2–3 weeks", icon: "🐍",
        topics: ["Variables, data types, operators", "Control flow: if/else, loops", "Functions, scope, modules", "Lists, dicts, sets, tuples"] },
      { phase: "Intermediate", duration: "3–4 weeks", icon: "⚙️",
        topics: ["OOP: classes, inheritance, dunder methods", "File I/O & exception handling", "List comprehensions, generators", "pip, venv, requirements.txt"] },
      { phase: "Advanced", duration: "4–6 weeks", icon: "🚀",
        topics: ["Decorators & context managers", "Concurrency: threading, asyncio", "Testing with pytest", "Type hints & dataclasses"] },
    ],
    resources: [
      { name: "Python Docs – Official Tutorial",                 url: "https://docs.python.org/3/tutorial/index.html",                                                           free: true  },
      { name: "Automate the Boring Stuff – Free Book",           url: "https://automatetheboringstuff.com/2e/chapter0/",                                                          free: true  },
      { name: "CS50P – Harvard Python (free course)",            url: "https://cs50.harvard.edu/python/2022/",                                                                    free: true  },
      { name: "▶ freeCodeCamp – Python Full Course (4h)",        url: "https://www.youtube.com/watch?v=rfscVS0vtbw",                                                              free: true  },
      { name: "▶ Corey Schafer – Python Tutorial Series",        url: "https://www.youtube.com/playlist?list=PL-osiE80TeTt2d9bfVyTiXJA-UTHn6WwU",                               free: true  },
      { name: "Coursera – Python for Everybody (U. Michigan)",   url: "https://www.coursera.org/specializations/python",                                                          free: false },
      { name: "Udemy – 100 Days of Code (Dr. Angela Yu)",        url: "https://www.udemy.com/course/100-days-of-code/",                                                           free: false },
    ],
  },
  javascript: {
    phases: [
      { phase: "Core JS", duration: "2–3 weeks", icon: "📜",
        topics: ["Variables (var/let/const), types", "Functions, scope & closures", "Arrays, objects, iteration", "DOM manipulation & events"] },
      { phase: "Modern ES6+", duration: "2–3 weeks", icon: "✨",
        topics: ["Arrow functions, destructuring", "Promises, async/await, fetch", "ES6 modules (import/export)", "Spread, rest, optional chaining"] },
      { phase: "Ecosystem", duration: "4–5 weeks", icon: "🌐",
        topics: ["Node.js basics & npm", "Bundlers: Vite or Webpack", "Testing with Jest", "TypeScript introduction"] },
    ],
    resources: [
      { name: "MDN – JavaScript Guide",                          url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide",                                           free: true  },
      { name: "javascript.info – Modern JS Tutorial",            url: "https://javascript.info/",                                                                                free: true  },
      { name: "Eloquent JavaScript – Free Book",                 url: "https://eloquentjavascript.net/",                                                                          free: true  },
      { name: "▶ freeCodeCamp – JS Full Course (3.5h)",          url: "https://www.youtube.com/watch?v=PkZNo7MFNFg",                                                              free: true  },
      { name: "▶ Traversy Media – JS Crash Course",              url: "https://www.youtube.com/watch?v=hdI2bqOjy3c",                                                              free: true  },
      { name: "Udemy – Complete JavaScript Course (Jonas S.)",   url: "https://www.udemy.com/course/the-complete-javascript-course/",                                             free: false },
    ],
  },
  typescript: {
    phases: [
      { phase: "Type Basics", duration: "1–2 weeks", icon: "🔷",
        topics: ["Type annotations, interfaces", "Union, intersection, literal types", "Generics basics", "tsconfig.json setup"] },
      { phase: "Advanced Types", duration: "2–3 weeks", icon: "⚙️",
        topics: ["Utility types (Partial, Pick, Omit)", "Conditional & mapped types", "Type guards & narrowing", "Declaration files (.d.ts)"] },
      { phase: "Real-world TS", duration: "2–3 weeks", icon: "🏭",
        topics: ["TS with React", "TS with Node.js / Express", "Strict mode best practices", "Migrating JS to TS"] },
    ],
    resources: [
      { name: "TypeScript – Official Handbook",                  url: "https://www.typescriptlang.org/docs/handbook/intro.html",                                                  free: true  },
      { name: "Total TypeScript – Beginners Tutorial (free)",    url: "https://www.totaltypescript.com/tutorials/beginners-typescript",                                           free: true  },
      { name: "▶ Net Ninja – TypeScript Playlist",               url: "https://www.youtube.com/playlist?list=PL4cUxeGkcC9gUgr39Q_yD6v-bSyMwKPUI",                               free: true  },
      { name: "▶ Fireship – TypeScript in 100 Seconds",          url: "https://www.youtube.com/watch?v=zQnBQ4tB3ZA",                                                              free: true  },
      { name: "Udemy – Understanding TypeScript (Max S.)",       url: "https://www.udemy.com/course/understanding-typescript/",                                                    free: false },
    ],
  },
  react: {
    phases: [
      { phase: "React Basics", duration: "2–3 weeks", icon: "⚛️",
        topics: ["JSX, functional components, props", "useState, useEffect hooks", "Event handling & controlled forms", "Component composition"] },
      { phase: "State & Navigation", duration: "2–3 weeks", icon: "🔀",
        topics: ["Context API & useReducer", "React Router v6", "Custom hooks", "Error boundaries"] },
      { phase: "Production React", duration: "3–4 weeks", icon: "🏭",
        topics: ["Performance: memo, useMemo, useCallback", "React Testing Library + Jest", "Next.js (SSR, SSG, App Router)", "State libs: Zustand or Redux Toolkit"] },
    ],
    resources: [
      { name: "React Docs – Learn React (official)",             url: "https://react.dev/learn",                                                                                  free: true  },
      { name: "Full Stack Open – Part 1 (Univ. Helsinki)",       url: "https://fullstackopen.com/en/part1",                                                                       free: true  },
      { name: "▶ Traversy Media – React Crash Course",           url: "https://www.youtube.com/watch?v=w7ejDZ8SWv8",                                                              free: true  },
      { name: "▶ Net Ninja – React Tutorial Playlist",           url: "https://www.youtube.com/playlist?list=PL4cUxeGkcC9gZD-Tvwfod2gaISzfRiP9d",                               free: true  },
      { name: "Udemy – React Complete Guide (Max S.)",           url: "https://www.udemy.com/course/react-the-complete-guide-incl-redux/",                                        free: false },
    ],
  },
  "machine learning": {
    phases: [
      { phase: "Math & Stats", duration: "3–4 weeks", icon: "📐",
        topics: ["Linear algebra (vectors, matrices)", "Probability & statistics fundamentals", "Calculus intuition (gradients, chain rule)", "NumPy & Pandas basics"] },
      { phase: "Core ML", duration: "4–6 weeks", icon: "🤖",
        topics: ["Supervised learning: regression, classification", "Unsupervised: k-means, PCA", "scikit-learn pipeline & preprocessing", "Model evaluation: CV, metrics, overfitting"] },
      { phase: "Deep Learning", duration: "6–8 weeks", icon: "🧠",
        topics: ["Neural networks & backpropagation", "CNNs for computer vision", "RNNs & Transformers for NLP", "PyTorch or TensorFlow basics", "Hugging Face ecosystem"] },
    ],
    resources: [
      { name: "fast.ai – Practical Deep Learning (free)",        url: "https://course.fast.ai/",                                                                                 free: true  },
      { name: "Kaggle Learn – Intro to Machine Learning",        url: "https://www.kaggle.com/learn/intro-to-machine-learning",                                                   free: true  },
      { name: "Dive into Deep Learning (d2l.ai)",                url: "https://d2l.ai/chapter_introduction/index.html",                                                           free: true  },
      { name: "▶ 3Blue1Brown – Neural Networks Series",          url: "https://www.youtube.com/playlist?list=PLZHQObOWTQDNU6R1_67000Dx_ZCJB-3pi",                               free: true  },
      { name: "▶ Andrej Karpathy – Neural Nets: Zero to Hero",   url: "https://www.youtube.com/playlist?list=PLAqhIrjkxbuWI23v9cThsA9GvCAUhRvKZ",                               free: true  },
      { name: "▶ StatQuest – ML Fundamentals Playlist",          url: "https://www.youtube.com/playlist?list=PLblh5JKOoLUICTaGLRoHQDuF_7q2GfuJF",                               free: true  },
      { name: "Coursera – ML Specialisation (Andrew Ng)",        url: "https://www.coursera.org/specializations/machine-learning-introduction",                                   free: false },
    ],
  },
  docker: {
    phases: [
      { phase: "Container Basics", duration: "1–2 weeks", icon: "📦",
        topics: ["Containers vs VMs", "docker run, pull, build", "Dockerfile instructions", "Image layers & caching"] },
      { phase: "Compose & Networks", duration: "1–2 weeks", icon: "🔗",
        topics: ["docker-compose.yml syntax", "Multi-container apps", "Named volumes & bind mounts", "Bridge networks & DNS"] },
      { phase: "Production", duration: "2–3 weeks", icon: "🔐",
        topics: ["Multi-stage builds for smaller images", "Docker Hub / ECR / GHCR", "Security scanning (Trivy, Snyk)", "Healthchecks & restart policies"] },
    ],
    resources: [
      { name: "Docker Docs – Official Get Started",              url: "https://docs.docker.com/get-started/",                                                                     free: true  },
      { name: "Play with Docker – Browser Sandbox",              url: "https://labs.play-with-docker.com/",                                                                       free: true  },
      { name: "▶ TechWorld with Nana – Docker Full Course",      url: "https://www.youtube.com/watch?v=3c-iBn73dDE",                                                              free: true  },
      { name: "▶ NetworkChuck – Docker Tutorial",                url: "https://www.youtube.com/watch?v=eGz9DS-aIeY",                                                              free: true  },
      { name: "Udemy – Docker Mastery (Bret Fisher)",            url: "https://www.udemy.com/course/docker-mastery/",                                                             free: false },
    ],
  },
  kubernetes: {
    phases: [
      { phase: "Core Objects", duration: "2–3 weeks", icon: "☸️",
        topics: ["Pods, ReplicaSets, Deployments", "Services: ClusterIP, NodePort, LoadBalancer", "ConfigMaps & Secrets", "kubectl commands"] },
      { phase: "Networking & Storage", duration: "2–3 weeks", icon: "🌐",
        topics: ["Ingress controllers (nginx)", "Persistent Volumes & Claims", "Network policies", "Namespaces & RBAC"] },
      { phase: "Operations", duration: "3–4 weeks", icon: "🛠️",
        topics: ["Helm charts", "Horizontal Pod Autoscaler", "Monitoring: Prometheus + Grafana", "Rolling updates & rollbacks"] },
    ],
    resources: [
      { name: "Kubernetes – Official Tutorials",                 url: "https://kubernetes.io/docs/tutorials/",                                                                    free: true  },
      { name: "Kubernetes – Concepts Docs",                      url: "https://kubernetes.io/docs/concepts/",                                                                     free: true  },
      { name: "Killercoda – K8s Interactive Labs",               url: "https://killercoda.com/playgrounds/scenario/kubernetes",                                                   free: true  },
      { name: "▶ TechWorld with Nana – K8s Full Course",         url: "https://www.youtube.com/watch?v=X48VuDVv0do",                                                              free: true  },
      { name: "▶ freeCodeCamp – Kubernetes Full Course",         url: "https://www.youtube.com/watch?v=d6WC5n9G_sM",                                                              free: true  },
      { name: "Udemy – CKA with Practice Tests (Mumshad M.)",   url: "https://www.udemy.com/course/certified-kubernetes-administrator-with-practice-tests/",                     free: false },
    ],
  },
  aws: {
    phases: [
      { phase: "Fundamentals", duration: "2–3 weeks", icon: "☁️",
        topics: ["IAM: users, roles, policies", "EC2: instances, AMIs, security groups", "S3: buckets, policies, lifecycle", "VPC, subnets, routing basics"] },
      { phase: "Core Services", duration: "3–4 weeks", icon: "⚙️",
        topics: ["RDS & DynamoDB", "Lambda & API Gateway", "ECS (Fargate) basics", "CloudWatch logging & alarms"] },
      { phase: "Architect Level", duration: "4–6 weeks", icon: "🏗️",
        topics: ["High availability & fault tolerance", "CloudFormation / CDK IaC", "Cost optimisation strategies", "SAA-C03 exam preparation"] },
    ],
    resources: [
      { name: "AWS – Official Getting Started",                  url: "https://aws.amazon.com/getting-started/",                                                                 free: true  },
      { name: "AWS Skill Builder – Free Training Catalog",       url: "https://explore.skillbuilder.aws/learn",                                                                   free: true  },
      { name: "▶ freeCodeCamp – AWS Cloud Practitioner (13h)",   url: "https://www.youtube.com/watch?v=3hLmDS179YE",                                                              free: true  },
      { name: "▶ TechWorld with Nana – AWS Fundamentals",        url: "https://www.youtube.com/watch?v=k1RI5locZE4",                                                              free: true  },
      { name: "Coursera – AWS Cloud Practitioner Essentials",    url: "https://www.coursera.org/learn/aws-cloud-practitioner-essentials",                                         free: false },
      { name: "Udemy – AWS SAA-C03 (Stéphane Maarek)",           url: "https://www.udemy.com/course/aws-certified-solutions-architect-associate-saa-c03/",                       free: false },
    ],
  },
  sql: {
    phases: [
      { phase: "Fundamentals", duration: "1–2 weeks", icon: "🗃️",
        topics: ["SELECT, WHERE, ORDER BY, LIMIT", "Aggregate functions: COUNT, SUM, AVG", "JOINs: INNER, LEFT, RIGHT, FULL", "GROUP BY & HAVING"] },
      { phase: "Intermediate", duration: "2–3 weeks", icon: "📊",
        topics: ["Subqueries & CTEs (WITH clause)", "Window functions: ROW_NUMBER, RANK, LAG", "Indexes & EXPLAIN query plans", "NULL handling"] },
      { phase: "Advanced", duration: "2–3 weeks", icon: "🔧",
        topics: ["Stored procedures & functions", "Transactions & ACID properties", "Database design & normalisation", "PostgreSQL vs MySQL differences"] },
    ],
    resources: [
      { name: "PostgreSQL – Official Tutorial",                  url: "https://www.postgresql.org/docs/current/tutorial.html",                                                    free: true  },
      { name: "SQLZoo – Interactive SQL Tutorial",               url: "https://sqlzoo.net/wiki/SQL_Tutorial",                                                                     free: true  },
      { name: "Mode Analytics – SQL for Data Analysis",          url: "https://mode.com/sql-tutorial/introduction-to-sql/",                                                       free: true  },
      { name: "LeetCode – SQL Practice Problems",                url: "https://leetcode.com/problemset/database/",                                                                free: true  },
      { name: "▶ freeCodeCamp – SQL Full Course",                url: "https://www.youtube.com/watch?v=HXV3zeQKqGY",                                                              free: true  },
      { name: "▶ Traversy Media – SQL Crash Course",             url: "https://www.youtube.com/watch?v=9ylj9NR0Lcg",                                                              free: true  },
      { name: "Udemy – Complete SQL Bootcamp (Jose Portilla)",   url: "https://www.udemy.com/course/the-complete-sql-bootcamp/",                                                  free: false },
    ],
  },
  java: {
    phases: [
      { phase: "Core Java", duration: "3–4 weeks", icon: "☕",
        topics: ["Variables, data types, operators", "OOP: classes, inheritance, polymorphism", "Collections: List, Map, Set", "Exception handling"] },
      { phase: "Intermediate", duration: "3–4 weeks", icon: "⚙️",
        topics: ["Generics & lambda expressions", "Streams API & functional interfaces", "File I/O & serialisation", "Multithreading basics"] },
      { phase: "Advanced", duration: "4–6 weeks", icon: "🚀",
        topics: ["Spring Boot fundamentals", "JUnit & Mockito testing", "Maven / Gradle build tools", "JDBC & JPA / Hibernate"] },
    ],
    resources: [
      { name: "Java Docs – Official Tutorials (Oracle)",         url: "https://dev.java/learn/",                                                                                  free: true  },
      { name: "▶ Programming with Mosh – Java for Beginners",    url: "https://www.youtube.com/watch?v=eIrMbAQSU34",                                                              free: true  },
      { name: "▶ Amigoscode – Java Masterclass",                 url: "https://www.youtube.com/watch?v=Qgl81fPcLc8",                                                              free: true  },
      { name: "Coursera – Java Programming (Duke University)",   url: "https://www.coursera.org/specializations/java-programming",                                                 free: false },
      { name: "Udemy – Java Masterclass (Tim Buchalka)",         url: "https://www.udemy.com/course/java-the-complete-java-developer-course/",                                    free: false },
    ],
  },
  "node.js": {
    phases: [
      { phase: "Node Basics", duration: "2–3 weeks", icon: "🟩",
        topics: ["Node.js runtime & event loop", "CommonJS & ES modules", "File system, path, os modules", "npm & package.json"] },
      { phase: "Web & APIs", duration: "3–4 weeks", icon: "🌐",
        topics: ["Express.js routing & middleware", "REST API design patterns", "Authentication with JWT", "Error handling & validation"] },
      { phase: "Production", duration: "3–4 weeks", icon: "🚀",
        topics: ["Async patterns: callbacks, promises, async/await", "Streams & buffers", "Testing with Jest/Mocha", "Deployment: PM2, Docker"] },
    ],
    resources: [
      { name: "Node.js – Official Getting Started Guide",        url: "https://nodejs.org/en/learn/getting-started/introduction-to-nodejs",                                      free: true  },
      { name: "Express.js – Official Guide",                     url: "https://expressjs.com/en/guide/routing.html",                                                              free: true  },
      { name: "▶ Net Ninja – Node.js Playlist",                  url: "https://www.youtube.com/playlist?list=PL4cUxeGkcC9jsz4LDYc6kv3ymONOKxwBU",                               free: true  },
      { name: "▶ Traversy Media – Node.js Crash Course",         url: "https://www.youtube.com/watch?v=fBNz5xF-Kx4",                                                              free: true  },
      { name: "Udemy – Complete Node.js Course (Andrew Mead)",   url: "https://www.udemy.com/course/the-complete-nodejs-developer-course-2/",                                     free: false },
    ],
  },
  mongodb: {
    phases: [
      { phase: "Basics", duration: "1–2 weeks", icon: "🍃",
        topics: ["Documents, collections, databases", "CRUD: insertOne, find, update, delete", "Query operators: $gt, $in, $regex", "Indexes and explain plans"] },
      { phase: "Intermediate", duration: "2–3 weeks", icon: "⚙️",
        topics: ["Aggregation pipeline stages", "$lookup (joins), $group, $project", "Schema design patterns", "Mongoose ODM with Node.js"] },
      { phase: "Production", duration: "2–3 weeks", icon: "🚀",
        topics: ["Atlas cloud setup & monitoring", "Replica sets & sharding basics", "Transactions & ACID guarantees", "Security: roles, authentication"] },
    ],
    resources: [
      { name: "MongoDB – Official Manual Introduction",          url: "https://www.mongodb.com/docs/manual/introduction/",                                                        free: true  },
      { name: "MongoDB University – Intro to MongoDB (free)",    url: "https://learn.mongodb.com/learning-paths/introduction-to-mongodb",                                         free: true  },
      { name: "▶ Net Ninja – MongoDB Tutorial Playlist",         url: "https://www.youtube.com/playlist?list=PL4cUxeGkcC9h77dJ-QJlwGlZlTd4ecZOA",                               free: true  },
      { name: "▶ Traversy Media – MongoDB Crash Course",         url: "https://www.youtube.com/watch?v=-56x56UppqQ",                                                              free: true  },
      { name: "Udemy – MongoDB Complete Guide (Max S.)",         url: "https://www.udemy.com/course/mongodb-the-complete-developers-guide/",                                      free: false },
    ],
  },
  git: {
    phases: [
      { phase: "Essentials", duration: "1 week", icon: "🌿",
        topics: ["init, add, commit, status, log", "Branching: branch, checkout, merge", "Remote: clone, push, pull, fetch", ".gitignore & git config"] },
      { phase: "Collaboration", duration: "1–2 weeks", icon: "🤝",
        topics: ["Pull requests & code review workflow", "Resolving merge conflicts", "git rebase & cherry-pick", "Tags & semantic versioning"] },
      { phase: "Advanced", duration: "2 weeks", icon: "🔬",
        topics: ["git bisect & blame for debugging", "Interactive rebase (squash, reorder)", "Hooks & automation", "Monorepo strategies"] },
    ],
    resources: [
      { name: "Pro Git – Official Free Book",                    url: "https://git-scm.com/book/en/v2",                                                                           free: true  },
      { name: "GitHub Docs – Getting Started",                   url: "https://docs.github.com/en/get-started/start-your-journey",                                                free: true  },
      { name: "▶ freeCodeCamp – Git & GitHub Full Course",       url: "https://www.youtube.com/watch?v=RGOj5yH7evk",                                                              free: true  },
      { name: "▶ Traversy Media – Git Crash Course",             url: "https://www.youtube.com/watch?v=SWYqp7iY_Tc",                                                              free: true  },
      { name: "Udemy – Git & GitHub Bootcamp (Colt Steele)",     url: "https://www.udemy.com/course/git-and-github-bootcamp/",                                                    free: false },
    ],
  },
  linux: {
    phases: [
      { phase: "Shell Basics", duration: "1–2 weeks", icon: "🐧",
        topics: ["Navigation: cd, ls, pwd, find", "File ops: cp, mv, rm, chmod, chown", "Text: cat, grep, sed, awk, sort", "Pipes & redirection: |, >, >>"] },
      { phase: "System", duration: "2–3 weeks", icon: "⚙️",
        topics: ["Process management: ps, kill, top, htop", "Users, groups & sudo", "Cron jobs & scheduling", "Package managers: apt, yum, dnf"] },
      { phase: "Scripting", duration: "2–3 weeks", icon: "📜",
        topics: ["Bash scripts: variables, loops, conditionals", "Functions & error handling", "Exit codes & traps", "Environment variables & .bashrc"] },
    ],
    resources: [
      { name: "The Linux Command Line – Free Book",              url: "https://linuxcommand.org/tlcl.php",                                                                        free: true  },
      { name: "Linux Foundation – Intro to Linux (edX, free)",  url: "https://www.edx.org/learn/linux/the-linux-foundation-introduction-to-linux",                               free: true  },
      { name: "▶ freeCodeCamp – Linux Command Line Full Course", url: "https://www.youtube.com/watch?v=ZtqBQ68cfJc",                                                              free: true  },
      { name: "▶ NetworkChuck – Linux for Hackers",              url: "https://www.youtube.com/watch?v=VbEx7B_PTOE",                                                              free: true  },
      { name: "Udemy – Linux Bootcamp (Colt Steele)",            url: "https://www.udemy.com/course/the-linux-command-line-bootcamp/",                                            free: false },
    ],
  },
  tensorflow: {
    phases: [
      { phase: "TF Fundamentals", duration: "2–3 weeks", icon: "🔥",
        topics: ["Tensors, variables, operations", "Keras Sequential & Functional API", "Training loop: compile, fit, evaluate", "Saving & loading models"] },
      { phase: "Computer Vision", duration: "3–4 weeks", icon: "👁️",
        topics: ["CNNs with Conv2D & pooling layers", "Transfer learning with pre-trained models", "Data augmentation & tf.data pipelines", "Object detection basics"] },
      { phase: "Advanced", duration: "3–4 weeks", icon: "🧠",
        topics: ["RNNs, LSTMs for sequences", "Custom training loops with GradientTape", "TF Serving & model deployment", "TFLite for mobile"] },
    ],
    resources: [
      { name: "TensorFlow – Official Beginner Tutorial",         url: "https://www.tensorflow.org/tutorials/quickstart/beginner",                                                  free: true  },
      { name: "TensorFlow – Keras API Guide",                    url: "https://www.tensorflow.org/guide/keras",                                                                    free: true  },
      { name: "▶ freeCodeCamp – TensorFlow 2.0 Full Course",     url: "https://www.youtube.com/watch?v=tPYj3fFJGjk",                                                              free: true  },
      { name: "▶ Daniel Bourke – TF for DL (fCC)",               url: "https://www.youtube.com/watch?v=tpCFfeUEGs8",                                                              free: true  },
      { name: "Coursera – DeepLearning.AI TF Developer Cert",    url: "https://www.coursera.org/professional-certificates/tensorflow-in-practice",                                free: false },
    ],
  },
  pytorch: {
    phases: [
      { phase: "PyTorch Basics", duration: "2–3 weeks", icon: "🔦",
        topics: ["Tensors & autograd", "nn.Module: building neural networks", "DataLoader & custom Datasets", "Training loop: forward, loss, backward, step"] },
      { phase: "Deep Learning", duration: "3–4 weeks", icon: "🧠",
        topics: ["CNNs, RNNs, LSTMs with PyTorch", "Transfer learning with torchvision", "Model evaluation & metrics", "GPU training with CUDA"] },
      { phase: "Production", duration: "2–3 weeks", icon: "🚀",
        topics: ["TorchScript & model export", "ONNX for cross-framework deployment", "PyTorch Lightning for cleaner training", "Hugging Face Transformers integration"] },
    ],
    resources: [
      { name: "PyTorch – Official 60-Minute Blitz Tutorial",     url: "https://pytorch.org/tutorials/beginner/deep_learning_60min_blitz.html",                                   free: true  },
      { name: "PyTorch – Learn the Basics Guide",                url: "https://pytorch.org/tutorials/beginner/basics/intro.html",                                                 free: true  },
      { name: "▶ Daniel Bourke – PyTorch for DL (fCC, 25h)",     url: "https://www.youtube.com/watch?v=Z_ikDlimN6A",                                                              free: true  },
      { name: "▶ Aladdin Persson – PyTorch Tutorials Playlist",  url: "https://www.youtube.com/playlist?list=PLhhyoLH6IjfxeoooqP9rhU3HJIAVAJ3Vz",                               free: true  },
      { name: "Udemy – PyTorch Zero to Mastery",                 url: "https://www.udemy.com/course/pytorch-for-deep-learning/",                                                  free: false },
    ],
  },
  pandas: {
    phases: [
      { phase: "Basics", duration: "1–2 weeks", icon: "🐼",
        topics: ["Series & DataFrame creation", "Selecting: loc, iloc, boolean indexing", "Reading CSV, Excel, JSON", "Data inspection: info, describe, value_counts"] },
      { phase: "Data Wrangling", duration: "2–3 weeks", icon: "🔧",
        topics: ["Handling missing data: fillna, dropna", "groupby & aggregation", "merge, join, concat DataFrames", "apply, map, lambda functions"] },
      { phase: "Advanced", duration: "2–3 weeks", icon: "📊",
        topics: ["Pivot tables & crosstab", "Time series: DatetimeIndex, resample", "MultiIndex & hierarchical data", "Performance: chunking, categorical dtype"] },
    ],
    resources: [
      { name: "Pandas – Official Getting Started Tutorials",     url: "https://pandas.pydata.org/docs/getting_started/intro_tutorials/index.html",                               free: true  },
      { name: "Kaggle – Pandas Course (free, hands-on)",         url: "https://www.kaggle.com/learn/pandas",                                                                      free: true  },
      { name: "▶ freeCodeCamp – Pandas Full Course",             url: "https://www.youtube.com/watch?v=vmEHCJofslg",                                                              free: true  },
      { name: "▶ Corey Schafer – Pandas Tutorial Series",        url: "https://www.youtube.com/playlist?list=PL-osiE80TeTsWmV9i9c58mdDCSskIFdDS",                               free: true  },
    ],
  },
  fastapi: {
    phases: [
      { phase: "Basics", duration: "1–2 weeks", icon: "⚡",
        topics: ["Path & query parameters", "Request bodies with Pydantic models", "Response models & status codes", "Async endpoints"] },
      { phase: "Intermediate", duration: "2–3 weeks", icon: "⚙️",
        topics: ["Dependency injection system", "JWT authentication & OAuth2", "Database integration with SQLAlchemy", "Background tasks"] },
      { phase: "Production", duration: "2–3 weeks", icon: "🚀",
        topics: ["Middleware & CORS configuration", "Testing with pytest + httpx", "Docker + Uvicorn deployment", "OpenAPI docs customisation"] },
    ],
    resources: [
      { name: "FastAPI – Official Tutorial (best resource)",     url: "https://fastapi.tiangolo.com/tutorial/",                                                                   free: true  },
      { name: "FastAPI – Advanced User Guide",                   url: "https://fastapi.tiangolo.com/advanced/",                                                                   free: true  },
      { name: "▶ Traversy Media – FastAPI Crash Course",         url: "https://www.youtube.com/watch?v=0sOvCWFmrtA",                                                              free: true  },
      { name: "▶ freeCodeCamp – FastAPI Full Course",            url: "https://www.youtube.com/watch?v=0RSdkCd3lcI",                                                              free: true  },
    ],
  },
  django: {
    phases: [
      { phase: "Django Basics", duration: "2–3 weeks", icon: "🎸",
        topics: ["Models, views, templates (MVT pattern)", "URL routing & namespacing", "Django ORM: queries, relations", "Admin panel customisation"] },
      { phase: "Intermediate", duration: "3–4 weeks", icon: "⚙️",
        topics: ["Django REST Framework (DRF)", "Class-based views & ViewSets", "Authentication: session, token, JWT", "Forms & form validation"] },
      { phase: "Production", duration: "3–4 weeks", icon: "🚀",
        topics: ["Static files & media uploads", "Celery for async tasks", "Caching with Redis/memcached", "Deployment: gunicorn, nginx, Heroku/AWS"] },
    ],
    resources: [
      { name: "Django – Official Tutorial (Polls App)",          url: "https://docs.djangoproject.com/en/stable/intro/tutorial01/",                                               free: true  },
      { name: "Django REST Framework – Official Tutorial",       url: "https://www.django-rest-framework.org/tutorial/quickstart/",                                               free: true  },
      { name: "▶ Traversy Media – Django Crash Course",          url: "https://www.youtube.com/watch?v=e1IyzVyrLSU",                                                              free: true  },
      { name: "▶ Net Ninja – Django Tutorial Playlist",          url: "https://www.youtube.com/playlist?list=PL4cUxeGkcC9ib4HsrXEYpQnTOTZE1x0uc",                               free: true  },
      { name: "Coursera – Django for Everybody (U. Michigan)",   url: "https://www.coursera.org/specializations/django",                                                          free: false },
      { name: "Udemy – Python Django Practical Guide (Max S.)", url: "https://www.udemy.com/course/python-django-the-practical-guide/",                                          free: false },
    ],
  },
  vue: {
    phases: [
      { phase: "Vue 3 Basics", duration: "2–3 weeks", icon: "💚",
        topics: ["Options API vs Composition API", "Template syntax: v-bind, v-on, v-if, v-for", "Components, props & emit", "Reactive refs & reactive()"] },
      { phase: "State & Routing", duration: "2–3 weeks", icon: "🔀",
        topics: ["Vue Router: dynamic routes, guards", "Pinia for state management", "Provide / inject", "Composables & custom hooks"] },
      { phase: "Production", duration: "3–4 weeks", icon: "🏭",
        topics: ["Vite build setup", "Unit testing with Vitest", "SSR with Nuxt 3", "TypeScript integration"] },
    ],
    resources: [
      { name: "Vue.js – Official Introduction Guide",            url: "https://vuejs.org/guide/introduction.html",                                                                free: true  },
      { name: "Vue.js – Interactive Tutorial",                   url: "https://vuejs.org/tutorial/",                                                                              free: true  },
      { name: "▶ Net Ninja – Vue.js 3 Tutorial Playlist",        url: "https://www.youtube.com/playlist?list=PL4cUxeGkcC9hYYGbV60Vq3IXYNfDk8At1",                               free: true  },
      { name: "▶ Traversy Media – Vue.js Crash Course",          url: "https://www.youtube.com/watch?v=qZXt1Aom3Cs",                                                              free: true  },
      { name: "Udemy – Vue.js Complete Guide (Max S.)",          url: "https://www.udemy.com/course/vuejs-2-the-complete-guide/",                                                 free: false },
    ],
  },
  "next.js": {
    phases: [
      { phase: "Next.js Basics", duration: "2–3 weeks", icon: "▲",
        topics: ["App Router vs Pages Router", "File-based routing & layouts", "Server & Client Components", "Data fetching: fetch, cache, revalidate"] },
      { phase: "Intermediate", duration: "2–3 weeks", icon: "⚙️",
        topics: ["Server Actions & form handling", "Route handlers (API routes)", "Middleware & edge runtime", "Image & font optimisation"] },
      { phase: "Production", duration: "2–3 weeks", icon: "🚀",
        topics: ["Authentication with NextAuth.js", "Incremental Static Regeneration (ISR)", "Vercel deployment & environment variables", "SEO & metadata API"] },
    ],
    resources: [
      { name: "Next.js – Official Learn Course",                 url: "https://nextjs.org/learn",                                                                                 free: true  },
      { name: "Next.js – Official Documentation",                url: "https://nextjs.org/docs",                                                                                  free: true  },
      { name: "▶ Traversy Media – Next.js Crash Course",         url: "https://www.youtube.com/watch?v=mTz0GXj8NN0",                                                              free: true  },
      { name: "▶ Net Ninja – Next.js 13 Playlist",               url: "https://www.youtube.com/playlist?list=PL4cUxeGkcC9jZIVqmy_QhfQdi6mzzvP7q",                               free: true  },
      { name: "Udemy – Next.js & React Complete Guide (Max S.)", url: "https://www.udemy.com/course/nextjs-react-the-complete-guide/",                                           free: false },
    ],
  },
  angular: {
    phases: [
      { phase: "Angular Basics", duration: "3–4 weeks", icon: "🅰️",
        topics: ["Components, templates & directives", "Data binding: interpolation, property, event, two-way", "Services & dependency injection", "Angular CLI setup"] },
      { phase: "Intermediate", duration: "3–4 weeks", icon: "⚙️",
        topics: ["Angular Router & lazy loading", "Reactive Forms & validation", "Observables & RxJS operators", "HttpClient & interceptors"] },
      { phase: "Advanced", duration: "3–4 weeks", icon: "🚀",
        topics: ["State management with NgRx", "Change detection & OnPush strategy", "Angular Signals (v17+)", "Unit testing with Jasmine & Karma"] },
    ],
    resources: [
      { name: "Angular – Official Learn Tutorial",               url: "https://angular.dev/tutorials/learn-angular",                                                              free: true  },
      { name: "Angular – Official Documentation",                url: "https://angular.dev/overview",                                                                             free: true  },
      { name: "▶ Traversy Media – Angular Crash Course",         url: "https://www.youtube.com/watch?v=3dHNOWTI7H8",                                                              free: true  },
      { name: "▶ Fireship – Angular in 100 Seconds",             url: "https://www.youtube.com/watch?v=Ata9cSC2WpM",                                                              free: true  },
      { name: "Udemy – Angular Complete Guide (Max S.)",         url: "https://www.udemy.com/course/the-complete-guide-to-angular-2/",                                           free: false },
    ],
  },
  go: {
    phases: [
      { phase: "Go Basics", duration: "2–3 weeks", icon: "🐹",
        topics: ["Variables, types, zero values", "Functions, multiple returns, variadic", "Structs, methods & interfaces", "Goroutines & channels basics"] },
      { phase: "Intermediate", duration: "3–4 weeks", icon: "⚙️",
        topics: ["Error handling patterns", "Slices, maps & pointers", "Packages & modules (go.mod)", "Standard library: net/http, os, io"] },
      { phase: "Advanced", duration: "3–4 weeks", icon: "🚀",
        topics: ["Concurrency patterns: WaitGroup, Mutex", "Context for cancellation & deadlines", "gRPC & Protocol Buffers", "Testing & benchmarking"] },
    ],
    resources: [
      { name: "Go – Official Tour (interactive, browser)",       url: "https://go.dev/tour/welcome/1",                                                                            free: true  },
      { name: "Go – Official Documentation",                     url: "https://go.dev/doc/",                                                                                      free: true  },
      { name: "▶ Traversy Media – Go (Golang) Crash Course",     url: "https://www.youtube.com/watch?v=YS4e4q9oBaU",                                                              free: true  },
      { name: "▶ freeCodeCamp – Go Full Course",                 url: "https://www.youtube.com/watch?v=un6ZyFkqFKo",                                                              free: true  },
      { name: "Udemy – Go Complete Developer's Guide (Grider)",  url: "https://www.udemy.com/course/go-the-complete-developers-guide/",                                          free: false },
    ],
  },
  jenkins: {
    phases: [
      { phase: "Basics", duration: "1–2 weeks", icon: "🔧",
        topics: ["Jenkins installation & setup", "Freestyle jobs vs Pipelines", "Jenkinsfile syntax (declarative)", "Build triggers & workspaces"] },
      { phase: "CI/CD Pipelines", duration: "2–3 weeks", icon: "🔄",
        topics: ["Stages: build, test, deploy", "Shared libraries & reusable steps", "Docker agents inside pipelines", "Environment variables & credentials"] },
      { phase: "Production", duration: "2–3 weeks", icon: "🚀",
        topics: ["Blue Ocean UI & visualisation", "Integration with GitHub/GitLab webhooks", "Distributed builds with agents", "Notifications: email, Slack"] },
    ],
    resources: [
      { name: "Jenkins – Official Pipeline Tour",                url: "https://www.jenkins.io/doc/pipeline/tour/getting-started/",                                               free: true  },
      { name: "Jenkins – User Handbook",                         url: "https://www.jenkins.io/doc/book/",                                                                        free: true  },
      { name: "▶ TechWorld with Nana – Jenkins Tutorial",        url: "https://www.youtube.com/watch?v=6YZvp2GwT0A",                                                              free: true  },
      { name: "▶ Amigoscode – Jenkins CI/CD Pipeline",          url: "https://www.youtube.com/watch?v=tuxO7ZXplRE",                                                              free: true  },
      { name: "Udemy – Jenkins: From Zero to Hero",              url: "https://www.udemy.com/course/jenkins-from-zero-to-hero/",                                                  free: false },
    ],
  },
  "ci/cd": {
    phases: [
      { phase: "Concepts", duration: "1–2 weeks", icon: "🔄",
        topics: ["Continuous Integration principles", "Continuous Delivery vs Deployment", "Trunk-based development", "Version control branching strategies"] },
      { phase: "Tooling", duration: "2–3 weeks", icon: "🛠️",
        topics: ["GitHub Actions workflows", "Jenkinsfile pipelines", "GitLab CI/CD YAML", "Build, test, lint, security scan stages"] },
      { phase: "Advanced", duration: "2–3 weeks", icon: "🚀",
        topics: ["Blue/green & canary deployments", "Rollback strategies", "Infrastructure as Code in pipelines", "Secrets management in CI"] },
    ],
    resources: [
      { name: "GitHub Actions – Official Quickstart",            url: "https://docs.github.com/en/actions/quickstart",                                                            free: true  },
      { name: "GitLab CI/CD – Official Documentation",           url: "https://docs.gitlab.com/ee/ci/",                                                                          free: true  },
      { name: "▶ TechWorld with Nana – CI/CD Full Course",       url: "https://www.youtube.com/watch?v=9BgIDqAzfuA",                                                              free: true  },
      { name: "▶ freeCodeCamp – DevOps CI/CD Explained",         url: "https://www.youtube.com/watch?v=scEDHsr3APg",                                                              free: true  },
    ],
  },
  terraform: {
    phases: [
      { phase: "IaC Basics", duration: "1–2 weeks", icon: "🏗️",
        topics: ["Terraform providers & resources", "HCL syntax: variables, outputs, locals", "terraform init, plan, apply, destroy", "State files & remote state (S3/Terraform Cloud)"] },
      { phase: "Modules & Advanced", duration: "2–3 weeks", icon: "⚙️",
        topics: ["Reusable modules structure", "Data sources & dynamic blocks", "Workspaces for environment separation", "for_each & count meta-arguments"] },
      { phase: "Production", duration: "2–3 weeks", icon: "🚀",
        topics: ["Terraform Cloud / HCP Terraform", "CI/CD integration (Atlantis, GitHub Actions)", "Drift detection & import existing resources", "Security scanning with tfsec / Checkov"] },
    ],
    resources: [
      { name: "Terraform – Official AWS Get Started Tutorial",   url: "https://developer.hashicorp.com/terraform/tutorials/aws-get-started",                                      free: true  },
      { name: "Terraform – Official Documentation",              url: "https://developer.hashicorp.com/terraform/docs",                                                            free: true  },
      { name: "▶ TechWorld with Nana – Terraform Full Course",   url: "https://www.youtube.com/watch?v=7xngnjfIlK4",                                                              free: true  },
      { name: "▶ freeCodeCamp – Terraform Course for Beginners", url: "https://www.youtube.com/watch?v=SLB_c_ayRMo",                                                              free: true  },
      { name: "Udemy – Terraform for DevOps (Mumshad M.)",       url: "https://www.udemy.com/course/terraform-beginner-to-advanced/",                                             free: false },
    ],
  },
  flask: {
    phases: [
      { phase: "Flask Basics", duration: "1–2 weeks", icon: "🌶️",
        topics: ["Routes & view functions", "Jinja2 templates & inheritance", "Request/response objects", "Static files & url_for"] },
      { phase: "Intermediate", duration: "2–3 weeks", icon: "⚙️",
        topics: ["Flask-SQLAlchemy ORM", "Flask-Login for authentication", "Blueprints for app structure", "Flask-WTF forms & CSRF protection"] },
      { phase: "Production", duration: "2–3 weeks", icon: "🚀",
        topics: ["REST APIs with Flask-RESTful", "Application factory pattern", "Testing with pytest-flask", "Deployment: gunicorn + nginx / Heroku"] },
    ],
    resources: [
      { name: "Flask – Official Quickstart Guide",               url: "https://flask.palletsprojects.com/en/latest/quickstart/",                                                  free: true  },
      { name: "Flask – Official Tutorial (Flaskr Blog)",         url: "https://flask.palletsprojects.com/en/latest/tutorial/",                                                    free: true  },
      { name: "▶ Traversy Media – Flask From Scratch",           url: "https://www.youtube.com/watch?v=zRwy8gtgJ1A",                                                              free: true  },
      { name: "▶ Net Ninja – Flask Tutorial Playlist",           url: "https://www.youtube.com/playlist?list=PL4cUxeGkcC9j5sFCPCu9EgVZlXJzrYs3p",                               free: true  },
      { name: "Udemy – Python & Flask Bootcamp (Jose Portilla)", url: "https://www.udemy.com/course/python-and-flask-bootcamp-create-websites-using-flask/",                      free: false },
    ],
  },
  graphql: {
    phases: [
      { phase: "GraphQL Basics", duration: "1–2 weeks", icon: "◈",
        topics: ["Queries, mutations & subscriptions", "Schema Definition Language (SDL)", "Types: scalar, object, enum, union", "Resolvers & the execution model"] },
      { phase: "Server Side", duration: "2–3 weeks", icon: "🖥️",
        topics: ["Apollo Server setup", "Context & authentication", "DataLoader for batching & N+1 fix", "Error handling & custom scalars"] },
      { phase: "Client Side", duration: "2–3 weeks", icon: "💻",
        topics: ["Apollo Client with React", "Queries with useQuery & useMutation hooks", "Caching & cache normalisation", "Fragments & code generation"] },
    ],
    resources: [
      { name: "GraphQL – Official Learn Guide",                  url: "https://graphql.org/learn/",                                                                               free: true  },
      { name: "Apollo Docs – Getting Started",                   url: "https://www.apollographql.com/docs/apollo-server/getting-started/",                                        free: true  },
      { name: "▶ Traversy Media – GraphQL Crash Course",         url: "https://www.youtube.com/watch?v=ed8SzALpx1Q",                                                              free: true  },
      { name: "▶ freeCodeCamp – GraphQL Full Course",            url: "https://www.youtube.com/watch?v=ZQL7tL2S0oQ",                                                              free: true  },
      { name: "Udemy – GraphQL with React (Stephen Grider)",     url: "https://www.udemy.com/course/graphql-with-react-course/",                                                  free: false },
    ],
  },
  azure: {
    phases: [
      { phase: "Azure Fundamentals", duration: "2–3 weeks", icon: "☁️",
        topics: ["Azure portal & subscriptions", "Compute: VMs, App Service, Functions", "Storage: Blob, Files, Queues", "Networking: VNet, NSG, Load Balancer"] },
      { phase: "Core Services", duration: "3–4 weeks", icon: "⚙️",
        topics: ["Azure SQL & Cosmos DB", "Azure Active Directory & RBAC", "Azure Container Instances & AKS", "Azure Monitor & Application Insights"] },
      { phase: "DevOps & IaC", duration: "3–4 weeks", icon: "🛠️",
        topics: ["Azure DevOps Pipelines", "ARM templates & Bicep", "Azure CLI & PowerShell automation", "AZ-900 / AZ-204 certification prep"] },
    ],
    resources: [
      { name: "Microsoft Learn – Azure Fundamentals (AZ-900)",   url: "https://learn.microsoft.com/en-us/training/paths/azure-fundamentals-describe-azure-architecture-services/", free: true  },
      { name: "Azure – Official Developer Guide",                url: "https://learn.microsoft.com/en-us/azure/guides/developer/azure-developer-guide",                           free: true  },
      { name: "▶ freeCodeCamp – AZ-900 Azure Fundamentals",      url: "https://www.youtube.com/watch?v=NKEFWyqJ5XA",                                                              free: true  },
      { name: "▶ Adam Marczak – Azure AZ-900 Playlist",          url: "https://www.youtube.com/playlist?list=PLGjZwEtPN7j-Q59JYso3L4_yoCjj2syrM",                               free: true  },
      { name: "Udemy – AZ-900 Azure Fundamentals (Scott Duffy)", url: "https://www.udemy.com/course/az900-azure/",                                                                free: false },
    ],
  },
  gcp: {
    phases: [
      { phase: "GCP Fundamentals", duration: "2–3 weeks", icon: "☁️",
        topics: ["GCP console & Cloud Shell", "Compute Engine, Cloud Run, GKE", "Cloud Storage & Firestore", "IAM: roles, service accounts, policies"] },
      { phase: "Data & ML Services", duration: "3–4 weeks", icon: "📊",
        topics: ["BigQuery for analytics", "Pub/Sub messaging", "Vertex AI & AutoML", "Cloud Functions & event-driven architecture"] },
      { phase: "DevOps on GCP", duration: "2–3 weeks", icon: "🛠️",
        topics: ["Cloud Build & Cloud Deploy", "Artifact Registry & GCR", "Terraform for GCP", "ACE / Professional Cloud Architect cert prep"] },
    ],
    resources: [
      { name: "Google Cloud – Official Get Started",             url: "https://cloud.google.com/docs/get-started",                                                                free: true  },
      { name: "Google Cloud Skills Boost (free courses)",        url: "https://www.cloudskillsboost.google/paths",                                                                free: true  },
      { name: "▶ freeCodeCamp – Google Cloud Digital Leader",    url: "https://www.youtube.com/watch?v=UGRDM2YAEUS",                                                              free: true  },
      { name: "▶ TechWorld with Nana – GCP Tutorial",            url: "https://www.youtube.com/watch?v=4D3X6Xl5c_Y",                                                              free: true  },
      { name: "Coursera – Google Cloud Fundamentals (Google)",   url: "https://www.coursera.org/learn/gcp-fundamentals",                                                          free: false },
    ],
  },
  spring: {
    phases: [
      { phase: "Spring Boot Basics", duration: "2–3 weeks", icon: "🍃",
        topics: ["Spring Boot project setup (Initializr)", "REST controllers & request mapping", "Spring Data JPA & Hibernate", "Dependency injection & beans"] },
      { phase: "Intermediate", duration: "3–4 weeks", icon: "⚙️",
        topics: ["Spring Security & JWT authentication", "Spring Data repositories & JPQL", "Exception handling & validation", "Configuration: profiles, properties"] },
      { phase: "Production", duration: "3–4 weeks", icon: "🚀",
        topics: ["Microservices with Spring Cloud", "Actuator for health & metrics", "Testing: JUnit 5 + Mockito + Testcontainers", "Docker deployment of Spring Boot apps"] },
    ],
    resources: [
      { name: "Spring – Official Getting Started Guides",        url: "https://spring.io/guides",                                                                                 free: true  },
      { name: "Spring Boot – Official Reference Docs",           url: "https://docs.spring.io/spring-boot/docs/current/reference/htmlsingle/",                                    free: true  },
      { name: "▶ Amigoscode – Spring Boot Full Course",          url: "https://www.youtube.com/watch?v=9SGDpanrc8U",                                                              free: true  },
      { name: "▶ TechWorld with Nana – Spring Boot Microservices",url: "https://www.youtube.com/watch?v=yi1gwYWCm5c",                                                             free: true  },
      { name: "Udemy – Spring Boot 3 & Spring 6 (Chad Darby)",  url: "https://www.udemy.com/course/spring-hibernate-tutorial/",                                                  free: false },
    ],
  },
  html: {
    phases: [
      { phase: "HTML Basics", duration: "1–2 weeks", icon: "🌐",
        topics: ["Document structure: head, body, meta", "Semantic elements: header, nav, main, footer", "Forms: input types, labels, validation attributes", "Tables, lists, media (img, video, audio)"] },
      { phase: "Accessibility & SEO", duration: "1–2 weeks", icon: "♿",
        topics: ["ARIA roles & attributes", "Alt text, lang attributes", "Meta tags for SEO", "Structured data (schema.org)"] },
      { phase: "Modern HTML", duration: "1–2 weeks", icon: "⚡",
        topics: ["HTML5 APIs: Canvas, Web Storage, Geolocation", "Custom data attributes (data-*)", "Template & slot elements (Web Components)", "Performance: lazy loading, preload, prefetch"] },
    ],
    resources: [
      { name: "MDN – HTML: HyperText Markup Language",           url: "https://developer.mozilla.org/en-US/docs/Learn/HTML/Introduction_to_HTML",                                 free: true  },
      { name: "HTML.spec.whatwg.org – Living Standard",          url: "https://html.spec.whatwg.org/multipage/",                                                                  free: true  },
      { name: "▶ Traversy Media – HTML Crash Course",            url: "https://www.youtube.com/watch?v=UB1O30fR-EE",                                                              free: true  },
      { name: "▶ freeCodeCamp – HTML Full Course",               url: "https://www.youtube.com/watch?v=pQN-pnXPaVg",                                                              free: true  },
      { name: "Coursera – HTML, CSS, JS for Web Dev (JHU)",      url: "https://www.coursera.org/learn/html-css-javascript-for-web-developers",                                    free: false },
      { name: "Udemy – Web Developer Bootcamp (Colt Steele)",    url: "https://www.udemy.com/course/the-web-developer-bootcamp/",                                                 free: false },
    ],
  },
  css: {
    phases: [
      { phase: "CSS Basics", duration: "1–2 weeks", icon: "🎨",
        topics: ["Selectors, specificity & cascade", "Box model: margin, border, padding", "Colors, typography & units (px, em, rem, %)", "Display: block, inline, inline-block"] },
      { phase: "Layout", duration: "2–3 weeks", icon: "📐",
        topics: ["Flexbox: containers, alignment, flex-grow", "CSS Grid: template areas, fr units, auto-fit", "Responsive design: media queries & breakpoints", "Position: static, relative, absolute, sticky"] },
      { phase: "Advanced", duration: "2–3 weeks", icon: "✨",
        topics: ["Custom properties (CSS variables)", "Animations & transitions", "Pseudo-classes & pseudo-elements", "CSS modules & BEM naming convention"] },
    ],
    resources: [
      { name: "MDN – CSS First Steps",                           url: "https://developer.mozilla.org/en-US/docs/Learn/CSS/First_steps",                                           free: true  },
      { name: "CSS-Tricks – A Complete Guide to Flexbox",        url: "https://css-tricks.com/snippets/css/a-guide-to-flexbox/",                                                  free: true  },
      { name: "CSS-Tricks – A Complete Guide to Grid",           url: "https://css-tricks.com/snippets/css/complete-guide-grid/",                                                 free: true  },
      { name: "▶ Traversy Media – CSS Crash Course",             url: "https://www.youtube.com/watch?v=yfoY53QXEnI",                                                              free: true  },
      { name: "▶ Kevin Powell – CSS for Beginners (YouTube)",    url: "https://www.youtube.com/playlist?list=PL4-IK0AVhVjM0xE0K2uZRvsM7LkIhsPT-",                               free: true  },
      { name: "Udemy – Web Developer Bootcamp (Colt Steele)",    url: "https://www.udemy.com/course/the-web-developer-bootcamp/",                                                 free: false },
    ],
  },
  express: {
    phases: [
      { phase: "Express Basics", duration: "1–2 weeks", icon: "🚂",
        topics: ["App setup & listen", "Route handlers: GET, POST, PUT, DELETE", "Request params, query, body", "Express Router & route grouping"] },
      { phase: "Middleware & APIs", duration: "2–3 weeks", icon: "⚙️",
        topics: ["Built-in & third-party middleware", "CORS, helmet, morgan", "Error-handling middleware", "REST API design with Express"] },
      { phase: "Production", duration: "2–3 weeks", icon: "🚀",
        topics: ["JWT authentication middleware", "Rate limiting & input validation", "Testing with Supertest + Jest", "Deployment with PM2 & nginx"] },
    ],
    resources: [
      { name: "Express.js – Official Hello World Guide",         url: "https://expressjs.com/en/starter/hello-world.html",                                                        free: true  },
      { name: "Express.js – Routing Guide",                      url: "https://expressjs.com/en/guide/routing.html",                                                              free: true  },
      { name: "▶ Traversy Media – Express Crash Course",         url: "https://www.youtube.com/watch?v=L72fhGm1tfE",                                                              free: true  },
      { name: "▶ Net Ninja – Express.js Tutorial Playlist",      url: "https://www.youtube.com/playlist?list=PL4cUxeGkcC9jsz4LDYc6kv3ymONOKxwBU",                               free: true  },
    ],
  },
  kafka: {
    phases: [
      { phase: "Kafka Basics", duration: "2–3 weeks", icon: "📨",
        topics: ["Topics, partitions & offsets", "Producers & consumers API", "Consumer groups & rebalancing", "kafka-topics, kafka-console scripts"] },
      { phase: "Intermediate", duration: "2–3 weeks", icon: "⚙️",
        topics: ["Kafka Streams basics", "Schema Registry & Avro/Protobuf", "Exactly-once semantics", "Kafka Connect for data integration"] },
      { phase: "Production", duration: "2–3 weeks", icon: "🚀",
        topics: ["Cluster setup & replication factor", "Monitoring with JMX, Prometheus & Grafana", "Kafka on Kubernetes (Strimzi / Confluent)", "Performance tuning: batching, compression"] },
    ],
    resources: [
      { name: "Apache Kafka – Official Quickstart",              url: "https://kafka.apache.org/quickstart",                                                                       free: true  },
      { name: "Confluent – Kafka Fundamentals (free course)",    url: "https://developer.confluent.io/courses/apache-kafka/events/",                                               free: true  },
      { name: "▶ freeCodeCamp – Apache Kafka Tutorial",          url: "https://www.youtube.com/watch?v=ut5kFHNKCEg",                                                              free: true  },
      { name: "▶ TechWorld with Nana – Kafka for Beginners",     url: "https://www.youtube.com/watch?v=aj9CDZm0Glc",                                                              free: true  },
      { name: "Udemy – Apache Kafka Series (Stéphane Maarek)",   url: "https://www.udemy.com/course/apache-kafka/",                                                               free: false },
    ],
  },
  elasticsearch: {
    phases: [
      { phase: "ES Basics", duration: "1–2 weeks", icon: "🔍",
        topics: ["Index, document & shard concepts", "REST API: index, search, delete", "Query DSL: match, term, bool, range", "Mappings & field types"] },
      { phase: "Search Relevance", duration: "2–3 weeks", icon: "⚙️",
        topics: ["Full-text search & analysers", "Aggregations: terms, histogram, date", "Highlighting & suggestions", "Boosting & function score queries"] },
      { phase: "Production", duration: "2–3 weeks", icon: "🚀",
        topics: ["Cluster, node & replica setup", "Index lifecycle management (ILM)", "Kibana dashboards & visualisations", "Security: TLS, users, roles"] },
    ],
    resources: [
      { name: "Elasticsearch – Official Getting Started",        url: "https://www.elastic.co/guide/en/elasticsearch/reference/current/getting-started.html",                    free: true  },
      { name: "Elasticsearch – Query DSL Reference",             url: "https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl.html",                          free: true  },
      { name: "▶ freeCodeCamp – Elasticsearch Tutorial",         url: "https://www.youtube.com/watch?v=BRDI7Z3kdFM",                                                              free: true  },
      { name: "Udemy – Complete Guide to Elasticsearch (Bo A.)", url: "https://www.udemy.com/course/elasticsearch-complete-guide/",                                               free: false },
    ],
  },
  scikit: {
    phases: [
      { phase: "ML with sklearn", duration: "2–3 weeks", icon: "🤖",
        topics: ["Estimator API: fit, predict, score", "Preprocessing: scaling, encoding, imputation", "Train/test split & cross-validation", "Classification: Logistic Regression, SVM, Trees"] },
      { phase: "Model Selection", duration: "2–3 weeks", icon: "🎯",
        topics: ["GridSearchCV & RandomizedSearchCV", "Pipeline: chaining preprocessors + estimators", "Evaluation: confusion matrix, ROC-AUC, F1", "Ensemble: RandomForest, GradientBoosting"] },
      { phase: "Advanced", duration: "2–3 weeks", icon: "🧠",
        topics: ["Feature selection & importance", "Dimensionality reduction: PCA, t-SNE", "Clustering: KMeans, DBSCAN, AgglomerativeClustering", "Custom transformers & sklearn-compatible classes"] },
    ],
    resources: [
      { name: "scikit-learn – Official Tutorials",               url: "https://scikit-learn.org/stable/tutorial/index.html",                                                      free: true  },
      { name: "scikit-learn – User Guide",                       url: "https://scikit-learn.org/stable/user_guide.html",                                                          free: true  },
      { name: "Kaggle – Intermediate ML Course (free)",          url: "https://www.kaggle.com/learn/intermediate-machine-learning",                                               free: true  },
      { name: "▶ freeCodeCamp – Machine Learning with sklearn",  url: "https://www.youtube.com/watch?v=0B5eIE_1vpU",                                                              free: true  },
      { name: "Coursera – ML Specialisation (Andrew Ng)",        url: "https://www.coursera.org/specializations/machine-learning-introduction",                                   free: false },
    ],
  },
  numpy: {
    phases: [
      { phase: "NumPy Basics", duration: "1–2 weeks", icon: "🔢",
        topics: ["ndarray creation: array, zeros, ones, arange", "Indexing, slicing & boolean masks", "Array shapes: reshape, transpose, flatten", "Element-wise arithmetic & broadcasting"] },
      { phase: "Intermediate", duration: "1–2 weeks", icon: "⚙️",
        topics: ["Universal functions (ufuncs)", "Linear algebra: dot, matmul, linalg", "Random module for reproducible experiments", "Stacking & splitting arrays"] },
      { phase: "Performance", duration: "1–2 weeks", icon: "⚡",
        topics: ["Vectorisation vs Python loops", "Memory layout: C vs Fortran order", "NumPy with Pandas & scikit-learn pipelines", "Numba for JIT-accelerated NumPy code"] },
    ],
    resources: [
      { name: "NumPy – Official Quickstart Tutorial",            url: "https://numpy.org/doc/stable/user/quickstart.html",                                                        free: true  },
      { name: "NumPy – Official Documentation",                  url: "https://numpy.org/doc/stable/",                                                                            free: true  },
      { name: "Kaggle – NumPy (hands-on notebook)",              url: "https://www.kaggle.com/code/legendadnan/numpy-tutorial-for-beginners-data-science",                        free: true  },
      { name: "▶ freeCodeCamp – NumPy Full Course",              url: "https://www.youtube.com/watch?v=QUT1VHiLmmI",                                                              free: true  },
      { name: "▶ Corey Schafer – NumPy Tutorial Series",         url: "https://www.youtube.com/playlist?list=PL-osiE80TeTsWmV9i9c58mdDCSskIFdDS",                               free: true  },
    ],
  },
  redis: {
    phases: [
      { phase: "Redis Basics", duration: "1–2 weeks", icon: "⚡",
        topics: ["Data structures: strings, lists, hashes, sets, sorted sets", "GET, SET, DEL, EXPIRE, TTL commands", "Redis as a cache: eviction policies", "Pub/Sub messaging basics"] },
      { phase: "Intermediate", duration: "1–2 weeks", icon: "⚙️",
        topics: ["Pipelining & transactions (MULTI/EXEC)", "Lua scripting", "Persistence: RDB snapshots vs AOF log", "Using Redis from Python (redis-py) / Node.js (ioredis)"] },
      { phase: "Production", duration: "2–3 weeks", icon: "🚀",
        topics: ["Redis Cluster & Sentinel for HA", "Redis Streams for event sourcing", "Rate limiting patterns", "Cache-aside, write-through & write-behind patterns"] },
    ],
    resources: [
      { name: "Redis – Official Getting Started",                url: "https://redis.io/docs/latest/get-started/",                                                                free: true  },
      { name: "Redis University – RU101 (free course)",          url: "https://university.redis.com/courses/ru101/",                                                               free: true  },
      { name: "▶ freeCodeCamp – Redis Full Course",              url: "https://www.youtube.com/watch?v=XCsS_NVAa1g",                                                              free: true  },
      { name: "▶ TechWorld with Nana – Redis Tutorial",          url: "https://www.youtube.com/watch?v=jgpVdJB2sKQ",                                                              free: true  },
    ],
  },
  prometheus: {
    phases: [
      { phase: "Monitoring Basics", duration: "1–2 weeks", icon: "📊",
        topics: ["Metrics types: counter, gauge, histogram, summary", "PromQL query language basics", "Scraping targets & service discovery", "Alertmanager & alert rules"] },
      { phase: "Grafana Dashboards", duration: "1–2 weeks", icon: "📈",
        topics: ["Connecting Grafana to Prometheus", "Building dashboards: panels, variables", "Node Exporter & application metrics", "Alert notifications: Slack, email, PagerDuty"] },
      { phase: "Production", duration: "2–3 weeks", icon: "🚀",
        topics: ["Prometheus Operator on Kubernetes", "Long-term storage: Thanos / Cortex", "High-cardinality metrics & best practices", "OpenTelemetry integration"] },
    ],
    resources: [
      { name: "Prometheus – Official Getting Started",           url: "https://prometheus.io/docs/prometheus/latest/getting_started/",                                            free: true  },
      { name: "Grafana – Official Getting Started",              url: "https://grafana.com/docs/grafana/latest/getting-started/build-first-dashboard/",                           free: true  },
      { name: "▶ TechWorld with Nana – Prometheus & Grafana",    url: "https://www.youtube.com/watch?v=h4Sl21AKiDg",                                                              free: true  },
      { name: "▶ freeCodeCamp – Grafana Tutorial",               url: "https://www.youtube.com/watch?v=lILY8eSspEo",                                                              free: true  },
    ],
  },
  grafana: {
    phases: [
      { phase: "Dashboards", duration: "1 week", icon: "📈",
        topics: ["Connecting data sources (Prometheus, InfluxDB)", "Panel types: graph, stat, table, heatmap", "Variables & template queries", "Annotations & time range controls"] },
      { phase: "Alerts & Explore", duration: "1 week", icon: "🔔",
        topics: ["Alert rules & notification channels", "Explore mode for ad-hoc queries", "Log aggregation with Loki", "Tracing with Tempo"] },
      { phase: "Advanced", duration: "1–2 weeks", icon: "⚙️",
        topics: ["Grafana as Code with Jsonnet / Grafonnet", "Provisioning dashboards via YAML", "Embedding panels & sharing", "Grafana Mimir for scalable metrics"] },
    ],
    resources: [
      { name: "Grafana – Official Build First Dashboard",        url: "https://grafana.com/docs/grafana/latest/getting-started/build-first-dashboard/",                           free: true  },
      { name: "Grafana – Official Documentation",                url: "https://grafana.com/docs/grafana/latest/",                                                                 free: true  },
      { name: "▶ TechWorld with Nana – Grafana Tutorial",        url: "https://www.youtube.com/watch?v=h4Sl21AKiDg",                                                              free: true  },
      { name: "▶ freeCodeCamp – Grafana & Prometheus Course",    url: "https://www.youtube.com/watch?v=lILY8eSspEo",                                                              free: true  },
    ],
  },
  langchain: {
    phases: [
      { phase: "LangChain Basics", duration: "1–2 weeks", icon: "🔗",
        topics: ["LLMs, PromptTemplates & output parsers", "Chains: LLMChain, SequentialChain", "ChatModels with message history", "Connecting OpenAI, Groq, Anthropic APIs"] },
      { phase: "Memory & Retrieval", duration: "2–3 weeks", icon: "🧠",
        topics: ["Conversation memory types", "Document loaders & text splitters", "Vector stores: Chroma, FAISS, Pinecone", "RAG pipeline: retriever + LLM chain"] },
      { phase: "Agents & Tools", duration: "2–3 weeks", icon: "🤖",
        topics: ["Agent types & ReAct reasoning pattern", "Custom tool creation", "LangGraph for stateful multi-agent flows", "LangSmith for tracing & evaluation"] },
    ],
    resources: [
      { name: "LangChain – Official Python Docs",                url: "https://python.langchain.com/docs/introduction/",                                                          free: true  },
      { name: "LangChain – Official Tutorials",                  url: "https://python.langchain.com/docs/tutorials/",                                                             free: true  },
      { name: "▶ freeCodeCamp – LangChain Crash Course",         url: "https://www.youtube.com/watch?v=HSZ_uaif57o",                                                              free: true  },
      { name: "▶ Greg Kamradt – LangChain Cookbook Playlist",    url: "https://www.youtube.com/playlist?list=PLqZXAkvF1bPNQER9mLmDbntNfSpzdDIU5",                               free: true  },
    ],
  },
  ansible: {
    phases: [
      { phase: "Ansible Basics", duration: "1–2 weeks", icon: "⚙️",
        topics: ["Inventory files & host groups", "Ad-hoc commands", "Playbooks: plays, tasks, handlers", "Modules: copy, template, service, package"] },
      { phase: "Roles & Variables", duration: "2–3 weeks", icon: "🗂️",
        topics: ["Roles directory structure", "Variables: group_vars, host_vars, vault", "Loops, conditionals & when statements", "Templates with Jinja2"] },
      { phase: "Advanced", duration: "2–3 weeks", icon: "🚀",
        topics: ["Ansible Galaxy roles", "Dynamic inventory with cloud providers", "Ansible Tower / AWX for CI/CD", "Testing with Molecule"] },
    ],
    resources: [
      { name: "Ansible – Official Getting Started",              url: "https://docs.ansible.com/ansible/latest/getting_started/index.html",                                      free: true  },
      { name: "Ansible – Official Documentation",                url: "https://docs.ansible.com/",                                                                                free: true  },
      { name: "▶ TechWorld with Nana – Ansible Tutorial",        url: "https://www.youtube.com/watch?v=1id6ERvfozo",                                                              free: true  },
      { name: "▶ freeCodeCamp – Ansible Full Course",            url: "https://www.youtube.com/watch?v=goclfp6a2IQ",                                                              free: true  },
      { name: "Udemy – Ansible for Beginners (Mumshad M.)",      url: "https://www.udemy.com/course/learn-ansible/",                                                              free: false },
    ],
  },
  default: {
    phases: [
      { phase: "Beginner",     duration: "2–4 weeks", icon: "📖",
        topics: ["Core syntax and fundamentals", "Official documentation walkthrough", "Follow beginner tutorials", "Build small practice projects"] },
      { phase: "Intermediate", duration: "4–6 weeks", icon: "⚙️",
        topics: ["Common patterns and best practices", "Integration with related tools", "Community tutorials and structured courses"] },
      { phase: "Advanced",     duration: "6–8 weeks", icon: "🚀",
        topics: ["Production-grade usage", "Performance and optimisation", "Build a portfolio project", "Contribute to open source"] },
    ],
    resources: [
      { name: "Official Documentation",           url: null,                                                                    free: true  },
      { name: "Coursera – search this skill",      url: "https://www.coursera.org/search?query={{skill}}",                      free: false },
      { name: "Udemy – top-rated courses",         url: "https://www.udemy.com/courses/search/?q={{skill}}&sort=highest-rated", free: false },
      { name: "▶ YouTube – search tutorials",      search: "full course for beginners",                                         free: true  },
    ],
  },
};

function getRoadmap(skill) {
  const key = skill.toLowerCase();
  for (const [k, v] of Object.entries(SKILL_ROADMAPS)) {
    if (key.includes(k)) return v;
  }
  return SKILL_ROADMAPS.default;
}

// ── Expandable roadmap card for a single skill ───────────────────────────────
function ExpandableRoadmap({ index, skill, why, forceOpen }) {
  const [open, setOpen] = useState(false);
  const roadmap = getRoadmap(skill);
  const isOpen  = forceOpen || open;

  return (
    <div style={{ border: "1px solid var(--border2)", borderRadius: "var(--radius)",
      background: "var(--bg)", overflow: "hidden" }}>

      {/* Header */}
      <button onClick={() => setOpen(o => !o)} style={{
        width: "100%", padding: "16px 20px", background: "none", border: "none",
        cursor: "pointer", display: "flex", justifyContent: "space-between",
        alignItems: "center", gap: 12,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, textAlign: "left", flexWrap: "wrap" }}>
          <span style={{
            width: 28, height: 28, borderRadius: "50%", background: "var(--surface)",
            border: "1.5px solid var(--danger)", display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: 12, fontWeight: 800,
            color: "var(--danger)", flexShrink: 0,
          }}>{index + 1}</span>
          <span style={{ fontFamily: "var(--font-head)", fontWeight: 700,
            fontSize: 16, color: "var(--text)" }}>{skill}</span>
          {why && <span style={{ fontSize: 13, color: "var(--muted)", fontStyle: "italic" }}>{why}</span>}
        </div>
        <span style={{ color: "var(--accent)", fontSize: 20, flexShrink: 0 }}>
          {isOpen ? "▾" : "▸"}
        </span>
      </button>

      {/* Expanded content */}
      {isOpen && (
        <div style={{ padding: "0 20px 24px" }}>

          {/* Phase timeline */}
          <div style={{ position: "relative", marginBottom: 24 }}>
            {/* Vertical connector line */}
            <div style={{ position: "absolute", left: 19, top: 4, bottom: 24,
              width: 2, background: "var(--border2)", zIndex: 0 }} />

            {roadmap.phases.map((phase, i) => (
              <div key={i} style={{ display: "flex", gap: 16, marginBottom: 22,
                position: "relative", zIndex: 1 }}>
                {/* Node */}
                <div style={{
                  width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
                  background: "var(--surface)", border: "2px solid var(--accent)",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
                }}>{phase.icon}</div>

                <div style={{ flex: 1, paddingTop: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 8 }}>
                    <span style={{ fontFamily: "var(--font-head)", fontWeight: 700,
                      fontSize: 14, color: "var(--text)" }}>
                      Phase {i + 1}: {phase.phase}
                    </span>
                    <span className="badge" style={{ fontSize: 11 }}>⏱ {phase.duration}</span>
                  </div>
                  <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 5 }}>
                    {phase.topics.map((t, j) => (
                      <li key={j} style={{ fontSize: 13, color: "var(--muted)",
                        display: "flex", alignItems: "flex-start", gap: 7 }}>
                        <span style={{ color: "var(--accent)", flexShrink: 0, marginTop: 1 }}>›</span>{t}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>

          {/* Resources */}
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)",
            marginBottom: 10, textTransform: "uppercase", letterSpacing: 1.2 }}>
            Recommended Resources
          </div>
          <div style={{ display: "grid", gap: 8 }}>
            {roadmap.resources.map((r, i) => {
              const isYoutube = r.name.startsWith("▶") || !!r.search;
              const rawUrl = r.url
                ? r.url.replace(/\{\{skill\}\}/g, encodeURIComponent(skill))
                : r.search
                ? `https://www.youtube.com/results?search_query=${encodeURIComponent(skill + " " + r.search)}`
                : `https://www.google.com/search?q=${encodeURIComponent(skill + " tutorial")}`;
              const href = rawUrl;
              return (
                <a key={i} href={href} target="_blank" rel="noopener noreferrer"
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "10px 14px", borderRadius: "var(--radius-sm)",
                    background: isYoutube ? "rgba(255,0,0,.05)" : "var(--surface)",
                    border: `1px solid ${isYoutube ? "rgba(255,0,0,.18)" : "var(--border)"}`,
                    textDecoration: "none", transition: "border-color .2s" }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = isYoutube ? "rgba(255,0,0,.4)" : "var(--border2)"}
                  onMouseLeave={e => e.currentTarget.style.borderColor = isYoutube ? "rgba(255,0,0,.18)" : "var(--border)"}
                >
                  <span style={{ fontSize: 14, color: "var(--text)", fontWeight: 500 }}>{r.name}</span>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span className={`badge ${r.free ? "green" : ""}`} style={{ fontSize: 11 }}>
                      {r.free ? "✓ Free" : "Paid"}
                    </span>
                    <span style={{ color: isYoutube ? "#ff4444" : "var(--accent)", fontSize: 13 }}>↗</span>
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Project card component ────────────────────────────────────────────────────
function ProjectCard({ project, index }) {
  const [open, setOpen] = useState(false);

  const diffColor = {
    Beginner:     "var(--accent2)",
    Intermediate: "var(--warn)",
    Advanced:     "var(--danger)",
  }[project.difficulty] || "var(--muted)";

  return (
    <div style={{ border: "1px solid var(--border2)", borderRadius: "var(--radius)",
      background: "var(--bg)", overflow: "hidden" }}>

      <button onClick={() => setOpen(o => !o)} style={{
        width: "100%", padding: "16px 20px", background: "none", border: "none",
        cursor: "pointer", display: "flex", justifyContent: "space-between",
        alignItems: "flex-start", gap: 12, textAlign: "left",
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap",
            marginBottom: 6 }}>
            <span style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--surface)",
              border: "1.5px solid var(--accent)", display: "flex", alignItems: "center",
              justifyContent: "center", fontSize: 12, fontWeight: 800, color: "var(--accent)",
              flexShrink: 0 }}>{index + 1}</span>
            <span style={{ fontFamily: "var(--font-head)", fontWeight: 700, fontSize: 16,
              color: "var(--text)" }}>{project.name}</span>
            <span className="badge" style={{ fontSize: 11 }}>{project.type}</span>
            <span className="badge" style={{ fontSize: 11, color: diffColor,
              borderColor: diffColor }}>{project.difficulty}</span>
            <span className="badge" style={{ fontSize: 11 }}>⏱ {project.estimated_time}</span>
          </div>
          <p style={{ fontSize: 13, color: "var(--muted)", margin: 0, paddingLeft: 38,
            lineHeight: 1.7 }}>{project.description}</p>
        </div>
        <span style={{ color: "var(--accent)", fontSize: 20, flexShrink: 0, marginTop: 4 }}>
          {open ? "▾" : "▸"}
        </span>
      </button>

      {open && (
        <div style={{ padding: "0 20px 24px", borderTop: "1px solid var(--border)" }}>

          {/* Tech stack */}
          {project.tech_stack?.length > 0 && (
            <div style={{ marginTop: 16, marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)",
                textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 8 }}>
                Tech Stack
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {project.tech_stack.map(t => (
                  <span key={t} className="badge accent" style={{ fontSize: 12 }}>{t}</span>
                ))}
              </div>
            </div>
          )}

          {/* Implementation steps */}
          {project.implementation_steps?.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)",
                textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 10 }}>
                Implementation Steps
              </div>
              <div style={{ display: "grid", gap: 8 }}>
                {project.implementation_steps.map((step, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <span style={{ width: 22, height: 22, borderRadius: "50%",
                      background: "var(--surface)", border: "1.5px solid var(--border2)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 11, fontWeight: 700, color: "var(--accent)", flexShrink: 0,
                      marginTop: 1 }}>{i + 1}</span>
                    <span style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.7 }}>
                      {step.replace(/^Step \d+:\s*/i, "")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Why it helps */}
          {project.why_it_helps && (
            <div style={{ padding: "10px 14px", borderRadius: "var(--radius-sm)",
              background: "rgba(123,241,168,.08)", border: "1px solid rgba(123,241,168,.2)",
              fontSize: 13, color: "var(--accent2)", lineHeight: 1.7 }}>
              <strong style={{ marginRight: 6 }}>Why this helps:</strong>
              {project.why_it_helps}
            </div>
          )}
        </div>
      )}
    </div>
  );
}


// ── Main page ─────────────────────────────────────────────────────────────────
export default function SkillGap() {
  const routeState = useLocation().state || {};

  const [form, setForm] = useState({
    target_job_title: routeState.target_job_title || "",
    required_skills:  (routeState.required_skills || []).join(", "),
    job_id:           routeState.job_id || "",
  });
  const [result, setResult]               = useState(null);
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState("");
  const [hasProfile, setHasProfile]       = useState(true);
  const [expandAll, setExpandAll]         = useState(false);
  const [projects, setProjects]           = useState(null);
  const [projectsLoading, setProjectsLoading] = useState(false);

  useEffect(() => {
    api.get("/my-profile").catch(() => setHasProfile(false));
    if (routeState.target_job_title) {
      runAnalysis({
        target_job_title: routeState.target_job_title,
        required_skills:  routeState.required_skills || [],
        job_id:           routeState.job_id || "",
      });
    }
  }, []);

  const fetchProjects = async (body, missingSkills) => {
    setProjectsLoading(true);
    try {
      const res = await api.post("/project-ideas", {
        target_job_title: body.target_job_title,
        required_skills:  body.required_skills || [],
        missing_skills:   missingSkills || [],
        job_id:           body.job_id || undefined,
      });
      setProjects(res.data);
    } catch {
      // Non-critical — fail silently
    } finally {
      setProjectsLoading(false);
    }
  };

  const runAnalysis = async (payload) => {
    setLoading(true); setError(""); setResult(null); setProjects(null);
    try {
      const body = payload || {
        target_job_title: form.target_job_title,
        required_skills:  form.required_skills.split(",").map(s => s.trim()).filter(Boolean),
        job_id:           form.job_id || undefined,
      };
      const res = await api.post("/skill-gap", body);
      setResult(res.data);
      fetchProjects(body, res.data.missing_skills || []);
    } catch (err) {
      const detail = err.response?.data?.detail || "";
      if (detail.includes("Upload")) setHasProfile(false);
      else setError(detail || "Analysis failed.");
    } finally { setLoading(false); }
  };

  const score      = result?.readiness_score ?? 0;
  const scoreColor = score >= 70 ? "var(--accent2)" : score >= 40 ? "var(--warn)" : "var(--danger)";

  if (!hasProfile) return (
    <div>
      <div className="page-header"><h1>Skill Gap Analysis</h1></div>
      <div className="card" style={{ textAlign: "center", padding: "48px 32px" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📄</div>
        <h3>Upload your resume first</h3>
        <p className="text-muted" style={{ marginTop: 8, marginBottom: 24 }}>
          We need your profile to run the analysis.
        </p>
        <Link to="/profile" className="apply-btn" style={{ display: "inline-flex" }}>Upload Resume</Link>
      </div>
    </div>
  );

  if (!routeState.target_job_title && !loading && !result) return (
    <div>
      <div className="page-header"><h1>Skill Gap Analysis</h1></div>
      <div className="card" style={{ textAlign: "center", padding: "48px 32px" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🎯</div>
        <h3>Select a job to analyse</h3>
        <p className="text-muted" style={{ marginTop: 8, marginBottom: 24 }}>
          Browse jobs and click <strong>Analyse Skill Gap</strong> on any listing to see your personalised roadmap.
        </p>
        <Link to="/jobs" className="apply-btn" style={{ display: "inline-flex" }}>Browse Jobs</Link>
      </div>
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <h1>Skill Gap Analysis</h1>
        <p>See exactly what you're missing — then follow a phase-by-phase roadmap to get job-ready.</p>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}

      {loading && (
        <div className="loading-center">
          <div className="spinner" />
          <p style={{ marginTop: 16 }}>AI is analysing your profile and building your learning roadmap…</p>
        </div>
      )}

      {result && (
        <div style={{ display: "grid", gap: 20 }}>

          {/* Readiness score card */}
          <div className="card">
            <div className="flex justify-between items-center"
              style={{ marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
              <div>
                <h2>Readiness Score</h2>
                <p className="text-muted text-sm" style={{ marginTop: 4 }}>
                  For: <strong style={{ color: "var(--text)" }}>
                    {form.target_job_title || routeState.target_job_title}
                  </strong>
                </p>
              </div>
              <div style={{ width: 90, height: 90, borderRadius: "50%",
                border: `4px solid ${scoreColor}`, display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                fontFamily: "var(--font-head)", fontWeight: 800,
                fontSize: 24, color: scoreColor }}>
                {score}%
                <span style={{ fontSize: 9, fontWeight: 400, color: "var(--muted)",
                  textTransform: "uppercase", letterSpacing: 1 }}>ready</span>
              </div>
            </div>
            <div className="readiness-bar-wrap">
              <div className="readiness-bar" style={{ width: `${score}%`, background: scoreColor }} />
            </div>
            <div style={{ display: "flex", fontSize: 11, color: "var(--muted)", marginTop: 6 }}>
              <span>0% — Beginner</span>
              <span style={{ marginLeft: "auto" }}>100% — Job-ready</span>
            </div>
            <p style={{ marginTop: 14, fontSize: 14, color: "var(--muted)", lineHeight: 1.8,
              borderTop: "1px solid var(--border)", paddingTop: 14 }}>
              {result.summary}
            </p>
          </div>

          {/* Skills columns */}
          <div className="flex wrap" style={{ gap: 16 }}>
            <div className="card" style={{ flex: 1, minWidth: 200 }}>
              <h3 style={{ marginBottom: 12 }}>
                <span style={{ color: "var(--accent2)" }}>✓</span>{" "}
                You already have ({result.matched_skills?.length || 0})
              </h3>
              <div className="skills-list">
                {result.matched_skills?.length > 0
                  ? result.matched_skills.map(s => <span key={s} className="badge green">{s}</span>)
                  : <span className="text-muted text-sm">None matched yet</span>}
              </div>
            </div>
            <div className="card" style={{ flex: 1, minWidth: 200 }}>
              <h3 style={{ marginBottom: 12 }}>
                <span style={{ color: "var(--danger)" }}>✗</span>{" "}
                Still need ({result.missing_skills?.length || 0})
              </h3>
              <div className="skills-list">
                {result.missing_skills?.length > 0
                  ? result.missing_skills.map(s => <span key={s} className="badge danger">{s}</span>)
                  : <span className="text-muted text-sm">🎉 No gaps — you're ready!</span>}
              </div>
            </div>
          </div>

          {/* Learning roadmap */}
          {result.missing_skills?.length > 0 && (
            <div>
              <div className="flex justify-between items-center" style={{ marginBottom: 14 }}>
                <div>
                  <h2>📚 Learning Roadmap</h2>
                  <p className="text-muted text-sm" style={{ marginTop: 4 }}>
                    Click any skill to see a 3-phase roadmap with curated resources.
                  </p>
                </div>
                <button className="nav-btn ghost" style={{ fontSize: 13 }}
                  onClick={() => setExpandAll(v => !v)}>
                  {expandAll ? "Collapse all" : "Expand all"}
                </button>
              </div>

              <div style={{ display: "grid", gap: 10 }}>
                {(result.recommended_learning?.length > 0
                  ? result.recommended_learning
                  : result.missing_skills.map(s => ({ skill: s, why: "" }))
                ).map((item, i) => (
                  <ExpandableRoadmap
                    key={i} index={i}
                    skill={item.skill} why={item.why}
                    forceOpen={expandAll}
                  />
                ))}
              </div>

              {/* Time estimate */}
              <div className="card" style={{ marginTop: 20, textAlign: "center", padding: "24px 32px" }}>
                <div style={{ fontFamily: "var(--font-head)", fontSize: 26, fontWeight: 800,
                  color: "var(--accent)", marginBottom: 6 }}>
                  ~{result.missing_skills.length * 5}–{result.missing_skills.length * 10} weeks
                </div>
                <div className="text-muted text-sm">
                  Estimated total time to close all {result.missing_skills.length} skill gap{result.missing_skills.length > 1 ? "s" : ""}{" "}
                  (studying 1–2 hours per day)
                </div>
              </div>
            </div>
          )}

          {/* ── Project Ideas ── */}
          <div style={{ marginTop: 8 }}>
            <div style={{ marginBottom: 14 }}>
              <h2>🛠 Suggested Projects</h2>
              <p className="text-muted text-sm" style={{ marginTop: 4 }}>
                AI-generated project ideas tailored to your background and this role.
                Each uses skills required for the job.
              </p>
            </div>

            {projectsLoading && (
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "20px 0" }}>
                <div className="spinner" style={{ width: 22, height: 22, borderWidth: 3 }} />
                <span className="text-muted text-sm">AI is generating project ideas for you…</span>
              </div>
            )}

            {projects && !projectsLoading && (
              <>
                {/* User context badge */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14,
                  flexWrap: "wrap" }}>
                  <span className={`badge ${projects.user_context === "professional" ? "accent" : "green"}`}
                    style={{ fontSize: 12 }}>
                    {projects.user_context === "professional" ? "👔 Professional" : "🎓 Student"} track
                  </span>
                  {projects.context_note && (
                    <span className="text-muted text-sm">{projects.context_note}</span>
                  )}
                </div>

                <div style={{ display: "grid", gap: 10 }}>
                  {projects.projects?.map((proj, i) => (
                    <ProjectCard key={i} project={proj} index={i} />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

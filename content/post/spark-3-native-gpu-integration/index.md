---
date: '2020-05-16T18:01:34.000Z'
description: You won't have to depend on your CPU anymore to run Spark based jobs.
  You will be able to offload them off to the GPU. Learn why it matters
image: 661c08375610fb416dbc1887.png
lastmod: '2024-04-14T17:38:22.174Z'
slug: spark-3-native-gpu-integration
tags:
- NVIDIA
- Spark
- Big Data
categories:
- Spark
title: 'Spark 3.0 adds native GPU integration: Why that matters?'
---

You can soon run your Apache Spark programs natively on your GPU. This became possible thanks to collaboration between Nvidia and Databricks. At the GPU Technology Conference, both the companies have presented a solution that brings GPU Acceleration to Spark 3.0 without major code changes.

## How things were before?

GPU based solutions have existed for Spark for a long time, so what has changed?

Such GPU integrations into Spark were provided by either third party libraries in Java/Scala, or you had to depend on Cloud Providers which would provide such an infrastructure to run Spark on GPU. Also, programs would usually be restricted to applications based on Spark ML, thus they generally couldn't be applied to other Big Data uses on Scale.

When it comes to Spark/Python, you had to use custom tools like Horovod, which would also end up using popular Python based libraries like Numpy and Tensorflow. Thus, this approach severely limits the performance of the Spark Programs due to the nature of Python, where programs are dynamically interpreted.

Don't get me wrong, Python has its very own unique use-cases which Scala doesn't provide (yet), but because Spark was built to do Big Data operations effectively, Python severely restricts the performance.

## What happened now?

With the release of Spark 3.0, native GPU based acceleration will be provided within Spark. This acceleration is based on the open source [RAPIDS](https://www.anrdoezrs.net/links/9041660/type/dlg/sid/zd-ad14a02e5d404bd4822065953dda157b--%7Cxid:fr1589641152241fef/https://developer.nvidia.com/rapids?ref=localhost) suite of software libraries, Nvidia built on [CUDA-X AI](https://www.anrdoezrs.net/links/9041660/type/dlg/sid/zd-ad14a02e5d404bd4822065953dda157b--%7Cxid:fr1589641152241dce/https://developer.nvidia.com/machine-learning?ref=localhost). This will allow developers to run Spark code without any modifications on GPUs - thereby alleviating load off the CPU.

This also benefits Spark SQL and `DataFrame` operations, thereby making the GPU acceleration benefits available for non-Machine Learning workloads as well. This will also bring capabilities where we don't have to provision a dedicated Spark Cluster for AI and ML based jobs.

In an advanced briefing for members of the press, NVidia CEO Jensen Huang explained that users of Spark clusters on [Azure Machine Learning](https://click.linksynergy.com/deeplink?id=IokOf8qagZo&mid=24542&u1=zd-ad14a02e5d404bd4822065953dda157b--%7Cxid%3Afr1589641152241ghb&murl=https%3A%2F%2Fazure.microsoft.com%2Fservices%2Fmachine-learning%2F&ref=localhost) or [Amazon SageMaker](https://aws.amazon.com/sagemaker/?ref=localhost) can benefit from the GPU acceleration as well. This means that the infrastructure is already in place, it is now upon other cloud providers to provide the necessary infrastructure, and upon developers to adopt and build their workloads to the new changes.

## Adobe + Spark GPU Acceleration

Adobe and Nvidia had signed a [deal](https://news.adobe.com/news/news-details/2018/Adobe-and-NVIDIA-Announce-Partnership-to-Deliver-New-AI-Services-for-Creativity-and-Digital-Experiences/default.aspx?ref=localhost) in 2018 where they will utilize Nvidia's AI capabilities for their solutions. Building upon this deal, Adobe has been an early adopter for this new GPU Acceleration on Spark, and they have shown a 7x improvement in performance of their workloads, while saving up to 90% of the costs.

These are serious numbers. Imagine, if a company as huge as Adobe is able to bring down costs while improving performance, other companies too can follow suit and we could see Profits and Performance for everyone. Period.

## Conclusion

Imagine how game changing this can prove to be for the Big Data community overall. No longer will we have to wait for operations to complete when we can utilize the GPU, we have on our local Gaming PCs and laptops. We will also be able to utilize GPU servers on Cloud for Spark without doing major changes.

This can also encourage many people to start using Scala for AI and Machine Learning instead of Python. While I do realize that there are no major visualization libraries supporting Spark available in Scala, an encouragement to do machine learning with Spark shall bring more enthusiasm for Scala, due to the disadvantages I mentioned for Python above. This in turn will lead to a growth in the Scala community, which will further result in availability of more and more libraries.

For now, there is a Scala visualization library that supports Spark, in active development, which when released to MVN Repository could be a game changer. Head over to [SwiftViz2's GitHub repo](https://github.com/MarkCLewis/SwiftVis2?ref=localhost) for more info. You can place safe bets on this one :)

In short, this is a win-win situation for everyone involved in this ecosystem.

Until another blog post, Ciao.

## SOURCES

[ZdNet](https://www.zdnet.com/article/nvidia-and-databricks-announce-gpu-acceleration-for-spark-3-0/?ref=localhost), [Nvidia Newsroom](https://nvidianews.nvidia.com/news/nvidia-accelerates-apache-spark-worlds-leading-data-analytics-platform?ref=localhost)
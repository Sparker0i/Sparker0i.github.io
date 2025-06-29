---
date: '2020-04-10T18:09:42.000Z'
description: Why extend classes to add a small functionality, when you could just
  write an implicit class? Read my post on how you too can take advantage of that
image: 661c08479bb70e9dac2bfee3.png
lastmod: '2024-04-14T17:44:55.121Z'
slug: scala-add-new-functions-to-existing-class
tags:
- Scala
categories:
- Scala
title: Add new functions to existing classes the Scala way
---

## Background

A [Spark `DataFrame`](https://github.com/apache/spark/blob/master/sql/core/src/main/scala/org/apache/spark/sql/package.scala?ref=localhost#L46) has a better advantage over a [Pandas `DataFrame`](https://pandas.pydata.org/pandas-docs/stable/reference/api/pandas.DataFrame.html?ref=localhost) when it comes to the ability to scale and process it. I'm writing more on this in another blog post which will arrive shortly after this one.

Functionally, both Spark and Pandas have an almost same set of functionalities, and their APIs are not so different either. There's one function which is used extensively in the data science community with Pandas - [`shape()`](https://pandas.pydata.org/pandas-docs/stable/reference/api/pandas.DataFrame.shape.html?ref=localhost). This function returns you the return the row and column count coupled inside a Tuple. Sadly, this functionality isn't available with Spark `DataFrame` ([and won't come either](https://issues.apache.org/jira/browse/SPARK-27756?ref=localhost)).

## Implicit classes in Scala

Fortunately, we have Implicit classes in Scala for our rescue. Implicit classes enable us to add some new functionality on top of an existing class' functionalities. To know more about Implicit Classes, you can read [this](http://www.lihaoyi.com/post/ImplicitDesignPatternsinScala.html?ref=localhost) article for diving deep.

First, we need to define a new implicit class with the method we want to add. In this case, I want to add the `shape()` function on top of the Spark `DataFrame` class.

```scala
implicit class DataFramePlus(df: DataFrame) {
    def shape(): (Long, Int) = (df.count(), df.columns.length)
}

```

Then all you need to do is print the shape of the `DataFrame`:

```scala
df = spark.read.format("<something>").load("<Filename>")
println(df.shape())

```

This solved a major pain point for me without having to extend an existing class.

## Best Practice

While writing these codes inside the Scala REPL (Scala/Spark Shell on Terminal) might seem a little easier to implement, openly exposing your code for everyone to use isn't a great idea.

Instead, you could implement the implicit class in a package object like this:

```scala
package me.sparker0i

import org.apache.spark.sql.DataFrame

package object machinelearning {
    implicit class DataFramePlus(df: DataFrame) {
        def shape(): (Long, Int) = (df.count(), df.columns.length)
    }
}

```

Then you'll need to add the proper import statement in your class, after which you can use the shape method with any `DataFrame`:

```scala
package me.sparker0i.machinelearning.regression

import org.apache.spark.sql.DataFrame
import me.sparker0i.machinelearning._

class LinearRegression {
    def function(df: DataFrame): Unit = {
        println(df.shape())
    }
}

```

### CONCLUSION

With this approach of using implicit classes in Scala, we no longer have to extend any existing class just to add additional functionality to it. You define the behavior you want, and then add that behavior to existing class instances after adding the proper `import` statements.

Inspired heavily from [Alvin Alexander's article](https://alvinalexander.com/scala/scala-2.10-implicit-class-example/?ref=localhost)
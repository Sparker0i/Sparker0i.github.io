---
date: '2024-08-06T22:01:48.090Z'
description: Transforming an Old Codebase for Better Modularity and Security with
  SOLID Principles and Design patterns
image: 66b29d4c63629cc69724f054.png
lastmod: '2024-08-06T22:02:48.656Z'
slug: refactor-a-tightly-coupled-codebase-by-following-solid-principles
tags:
- SOLID Principles
- Clean Code
- Refactor
- Software Architecture
categories:
- Clean Code
- Software Architecture
title: Refactor a tightly coupled codebase by following SOLID Principles
---

We've been developing an AI-enabled data engineering product at our company, using Scala as the core programming language. We also utilize Scala-related frameworks like Spark and Play to power various components. Recently, we conducted a vulnerability scan on our applications and discovered numerous security issues. The root cause was that we hadn't updated our libraries in over three years.

During this period, Scala underwent a major release and introduced its first Long-Term Support (LTS) version. Alongside these updates, our codebase had accumulated significant technical debt, providing us with an opportunity to address longstanding inefficiencies.

Background
----------

We had been using the [`scalaj-http`](https://github.com/scalaj/scalaj-http) library for making HTTP calls in Scala. However, this library had reached its end-of-life (EOL) status over two years ago and was no longer receiving updates.

This is a small snippet of our class which defines the methods making HTTP calls:

```scala
def makePostCall(url: String, body: String, authToken: String): (Int, JsValue) = {
    println("url: "+url)
    println("body: "+body)
    val res = Http(url)
      .header("Content-Type", "application/json")
      .header("Authorization", s"Bearer $authToken")
      .header("Charset", "UTF-8")
      .option(HttpOptions.readTimeout(100000000))
      .option(HttpOptions.connTimeout(100000000))
      .postData(body)
      .asString


    val code = res.code
    val response = Json.parse(res.body)

    (code, response)
}

def makeGetCall(url: String, authToken: String): (Int, JsValue) = {
    println("url: "+url)
    val res = Http(url)
      .header("Content-Type", "application/json")
      .header("Authorization", s"Bearer $authToken")
      .header("Charset", "UTF-8")
      .option(HttpOptions.readTimeout(100000000))
      .option(HttpOptions.connTimeout(100000000))
      .asString

    val code = res.code
    val response = Json.parse(res.body)

    (code, response)
}

// More methods for more HTTP types.

```

With our existing code base, there was no scope of any modification. It had a lot of limitations:

1. HTTP call functions were hardcoded.
2. Headers were not modifiable
3. Authentication was limited to Bearer tokens
4. The request body format was restricted to JSON
5. HTTP methods could not be easily altered.

These limitations affected not only our HTTP class but also other classes that relied on it. With the EOL of `scalaj-http`, we needed to refactor our codebase significantly.

Inspiration
-----------

![A sample REST API Client](66b29d4c63629cc69724f054_f2e3b482-7e1b-45d3-a23e-4986ed15fcc6.jpeg)

Many software developers and testers use REST API clients to test API endpoints. Various REST API clients exist, and the one you see above is Bruno - One of the only REST clients that meet my org's stringent IT Security Standards.

The flexibility of API clients - allowing for different HTTP methods, body types, and authentication mechanisms - is crucial. This adaptability is possible because these clients are not hardcoded, unlike our previous implementation. Therefore, in our refactoring, we aimed to make our code modular and adhere to known design patterns and SOLID principles.

Breakdown
---------

In our previous implementation, constructing the HTTP request and making the call were done within a single file. This approach meant that any modification required changes across multiple classes, leading to tight coupling.

To resolve this, we decided to separate our API package into three subpackages:

1. `request`
2. `client`
3. `apps`

The `request` and `client` components are designed to be loosely coupled. This separation ensures that changes in one part, such as switching to a different client library, require minimal modifications elsewhere in the code. Ideally, only a single line should need updating to change the client library used throughout the program. Classes inside `apps` would use the client to execute business processes by making the HTTP calls.

Request Package
---------------

To construct an HTTP request, there are five fundamental components:

1. URL
2. Headers
3. HTTP Method
4. Body
5. Authentication

It's a widely accepted convention that the URL is a `String`, while headers are represented as a `HashMap` with `String` keys and values.

The elements that can vary between HTTP requests are the Method, Body, and Authentication.

### Method

In this initial implementation of the Request package, I've chosen to support the most commonly used HTTP methods:

1. GET
2. POST
3. PUT
4. DELETE

```scala
trait ApiMethod        // trait is the equivalent for interface in OOP langugaes

case object DELETE extends ApiMethod
case object GET extends ApiMethod
case object POST extends ApiMethod
case object PUT extends ApiMethod

```

To implement these, I use a Scala-specific paradigm called [`Case Object`](https://docs.scala-lang.org/overviews/scala-book/case-objects.html), which aligns with the [Singleton design pattern](https://sourcemaking.com/design_patterns/singleton). This approach is similar to enums in other programming languages.

### Body

For the body of HTTP requests, I will support four types:

1. JSON
2. XML
3. Binary
4. FormURLEncoded

To manage these, I created an interface (`ApiBody`) that specifies two methods: `contentType` and `content`. Each respective class will have a default constructor that includes a variable representing the content we intend to send.

The `contentType` method will return the MIME type, such as `application/json` or `application/xml`. The `content` method will convert the body content into a byte array. The choice of a byte array is deliberate; while JSON and XML content can often be represented as a string, binary data cannot. By converting all types into a byte array, we provide a consistent interface for later client implementations.

```scala
trait ApiBody {
  def contentType: String
  def content: Array[Byte]
}

case class JsonBody(json: String) extends ApiBody {
  override def contentType: String = "application/json"
  override def content: Array[Byte] = json.getBytes("UTF-8")
}

case class XmlBody(xml: String) extends ApiBody {
  override def contentType: String = "application/xml"
  override def content: Array[Byte] = xml.getBytes("UTF-8")
}

case class FormUrlEncodedBody(formData: Map[String, String]) extends ApiBody {
  override def contentType: String = "application/x-www-form-urlencoded"
  override def content: Array[Byte] = formData
    .map(e => java.net.URLEncoder.encode(e._1, "UTF-8") + "=" + java.net.URLEncoder.encode(e._2, "UTF-8"))
    .mkString("&")
    .getBytes("UTF-8")
}

case class BinaryBody(data: Array[Byte]) extends ApiBody {
  override def contentType: String = "application/octet-stream"
  override def content: Array[Byte] = data
}

```

### Authentication

We will implement two common types of authentication:

1. Token based authentication
2. Basic authentication (user/password)

The plan was to use the same approach as with Body and Method, by defining an interface and corresponding classes. However, there’s a challenge: different client libraries may handle authentication in unique ways. Since the Request package must remain unaware of the Client package's specifics, a direct implementation isn’t feasible.

One potential solution is to use headers since they can be represented as a key-value map. This method works for basic and token-based authentication but fails for more complex mechanisms, such as GitHub API or AWS S3 SDK with v4 signature. These mechanisms often require access to the request body to generate appropriate headers.

In my implementation, I have kept Body and Authentication separate, and I intend to maintain that separation. The solution involves creating an interface and corresponding classes for authentication types, along with a wrapper that encapsulates all authentication mechanisms. This wrapper will then be implemented by the Client to execute the HTTP call.

```scala
trait AuthRequestProvider {
  def addBearerToken(token: String): Unit
  def addBasicAuth(username: String, password: String): Unit
}

trait ApiAuth {
  def applyTo(request: AuthRequestProvider): Unit
}

case class BasicAuth(username: String, password: String) extends ApiAuth {
  override def applyTo(request: AuthRequestProvider): Unit = {
    request.addBasicAuth(username, password)
  }
}

case class TokenAuth(token: String) extends ApiAuth {
  override def applyTo(request: AuthRequestProvider): Unit = {
    request.addBearerToken(token)
  }
}

```

The implementation of the `AuthRequestProvider` in the Client package will be discussed in a subsequent section.

### API Request

With the basics of building an HTTP Request covered, the next step is to create a class representing our `ApiRequest`. This class will be used by the client to execute the actual HTTP call.

```scala
protected[api] case class ApiRequest(
                        method: ApiMethod,
                        url: String,
                        body: Option[ApiBody] = None,
                        headers: Map[String, String] = Map.empty,
                        authentication: Option[ApiAuth] = None
                      )

```

In this class, the `Method` and `URL` are mandatory components for making an HTTP call. While headers are optional, they are represented using a `Map` data type, so no dedicated class is necessary. The `Body` and `Authentication` components are also optional and are encapsulated using the [`Option` wrapper](https://docs.scala-lang.org/overviews/collections-2.13/conversion-between-option-and-the-collections.html#inner-main). If a component is absent, it will be represented as `None`; if present, it will be enclosed within a `Some` object.

The `protected[api]` modifier on the case class restricts its instantiation to within the `api` package, which includes both the request and client sub-packages. This ensures that downstream classes cannot create substandard `ApiRequest` instances, maintaining the integrity of our API implementation.

### API Request Builder

Downstream classes should use the `ApiRequestBuilder` to create an `ApiRequest` object, which they can then pass to the client for making the HTTP call. This implementation follows the [Builder design pattern](https://sourcemaking.com/design_patterns/builder).

```scala
case class ApiRequestBuilder(
                               private val method: Option[ApiMethod] = Some(GET),
                               private val url: String = "",
                               private val body: Option[ApiBody] = None,
                               private val headers: Map[String, String] = Map(),
                               private val authentication: Option[ApiAuth] = None
                             ) {
  def withMethod(method: ApiMethod): ApiRequestBuilder = this.copy(method = Some(method))

  def withUrl(url: String): ApiRequestBuilder = this.copy(url = url)

  def withBody(body: ApiBody): ApiRequestBuilder = this.copy(body = Some(body))

  def withHeaders(headers: Map[String, String]): ApiRequestBuilder = this.copy(headers = headers)

  def addHeader(key: String, value: String): ApiRequestBuilder = this.copy(headers = headers + (key -> value))

  def withAuthentication(auth: ApiAuth): ApiRequestBuilder = this.copy(authentication = Some(auth))

  def build(): ApiRequest = {
    if (method.isEmpty || url.isEmpty) throw new IllegalStateException("Method and URL cannot be empty")
    ApiRequest(method.get, url, body, headers, authentication)
  }
}

```

The usage is straightforward: methods like `withUrl`, `withHeaders` and others allow you to configure your request. The `build()` method then produces the `ApiRequest` object, which can be passed to the client from downstream classes.

### API Response

When an HTTP request is made, a response is received, which can influence decisions within the application. The `APIResponse` case class encapsulates this response, including the HTTP response code, response body, and response headers.

```scala
case class ApiResponse(code: Int, body: ApiBody, headers: Map[String, String] = Map())

```

For the response body, we utilize the same `ApiBody` interface as for the request body, maintaining consistency across request and response handling.

Client
------

With our Request package established, we now focus on the client responsible for making the actual HTTP call. The client will be defined as an interface with a single method, `send`, which accepts an instance of `ApiRequest`.

```scala
trait ApiClient {
  def send(request: ApiRequest): Either[ApiResponse, ApiResponse]
}

```

### Client Library

For our client implementation, we use the Scala [STTP](https://github.com/softwaremill/sttp) library, which will consume `ApiRequest` and generate an `ApiResponse`. Before implementing the client, we need to address two key components:

1. **Authentication Wrapper**: An implementation to handle various authentication mechanisms.
2. **Body Parser**: To convert the response body into an appropriate `ApiBody` implementation.

### Authentication Wrapper

The authentication wrapper for the STTP library will accept an STTP `Request` as a constructor argument and provide the necessary authentication logic.

```scala
class SttpRequestProviderWrapper(var request: sttp.client4.Request[Either[String, String]]) extends AuthRequestProvider {
    override def addBearerToken(token: String): Unit = {
      request = request.auth.bearer(token)
    }

    override def addBasicAuth(username: String, password: String): Unit = {
      request = request.auth.basic(username, password)
    }
}

```

This wrapper can be extended to support additional authentication mechanisms as needed. The request (`sttp.client4.Request[Either[String, String]]`) will include the request body, allowing the wrapper to generate custom HTTP headers based on the body content.

### Body Parser

To transform the response body into one of our `ApiBody` implementations, we create a `BodyParser` interface. This interface will take the response content and headers, returning the appropriate body type.

```scala
trait BodyParser {
  def parseBody(): ApiBody
}

case class BinaryParser(content: Array[Byte], contentType: String) extends BodyParser {
  override def parseBody(): ApiBody = BinaryBody(content, contentType)
}

case class JsonParser(content: Array[Byte]) extends BodyParser {
  override def parseBody(): ApiBody = JsonBody(new String(content, "UTF-8"))
}

case class XmlParser(content: Array[Byte]) extends BodyParser {
  override def parseBody(): ApiBody = XmlBody(new String(content, "UTF-8"))
}

case class StringParser(content: Array[Byte]) extends BodyParser {
  override def parseBody(): ApiBody = StringBody(new String(content, "UTF-8"))
}

case class FormUrlEncodedParser(content: Array[Byte]) extends BodyParser {
  override def parseBody(): ApiBody = {
    val decodedContent = new String(content, "UTF-8")
    val formData = decodedContent.split("&").map { pair =>
      val Array(key, value) = pair.split("=")
      java.net.URLDecoder.decode(key, "UTF-8") -> java.net.URLDecoder.decode(value, "UTF-8")
    }.toMap
    FormUrlEncodedBody(formData)
  }
}

```

A [Factory design pattern](https://sourcemaking.com/design_patterns/factory_method) will be used to instantiate the appropriate `BodyParser`:

```scala
object BodyParser {
  def getParser(content: Array[Byte], headers: Map[String, String]): Option[BodyParser] = headers.get("content-type") match {
    case Some(value) => value match {
      case "application/json" => Some(JsonParser(content))
      case "application/xml" => Some(XmlParser(content))
      case "application/x-www-form-urlencoded" => Some(FormUrlEncodedParser(content))
      case _ => Some(BinaryParser(content))
    }
    case None => None
  }
}

```

### Client Implementation

With the building blocks in place, we implement the client. The client will use the `ApiRequest` properties (method, URL, headers) to construct the initial request, apply the body if present, and then handle authentication if required.

```scala
protected[api] class SttpClient extends ApiClient {
  private val backend = HttpURLConnectionBackend()

  override def send(request: ApiRequest): Either[ApiResponse, ApiResponse] = {
    try {
      new URI(request.url).toURL
    }
    catch {
      case e: URISyntaxException => return Left(ApiResponse(500, Some(JsonBody(ujson.Obj("message" -> e.getMessage).toString())), Map()))
      case e: IllegalArgumentException => return Left(ApiResponse(500, Some(JsonBody(ujson.Obj("message" -> e.getMessage).toString())), Map()))
    }

    var sttpRequest = sttp.client4.basicRequest.method(sttp.model.Method(request.method.toString), uri"${request.url}")

    request.headers.foreach { case (key, value) =>
      sttpRequest = sttpRequest.header(key, value)
    }

    request.body.foreach { body =>
      sttpRequest = sttpRequest.body(body.content).contentType(body.contentType)
    }

    val authRequest = new SttpRequestProviderWrapper(sttpRequest)
    request.authentication.foreach(_.applyTo(authRequest))
    sttpRequest = authRequest.request

    val response = sttpRequest.response(asByteArray).send(backend)
    val headers = response.headers.map(h => h.name -> h.value).toMap
    val responseEntity = ApiResponse(
      response.code.code,
      response.body match {
        case Left(error) => BodyParser.getParser(error.getBytes("UTF-8"), headers) match {
          case Some(value) => Some(value.parseBody())
          case None => None
        }
        case Right(value) => Some(BodyParser.getParser(value, headers).get.parseBody())
      },
      headers
    )

    if (response.code.isClientError || response.code.isServerError) Left(responseEntity)
    else Right(responseEntity)
  }
}

```

Ensure stability of API package
-------------------------------

A primary motivation for this rewrite is to minimize the impact of a library going end-of-life (EOL) in the future. If the STTP library becomes unsupported, we should only need to make a single line change in our code, ensuring the rest of the classes remain unaffected.

In the `SttpClient` implementation, the access modifier is set to `protected[api]`. This restricts access to within the `api` package, preventing direct usage outside. To facilitate client access, we define an `ApiClient` object in the same file as the `ApiClient` trait. This object includes an `apply()` method that creates a new instance of `SttpClient`, leveraging its position within the `api` subpackage.

```scala
object ApiClient {
  def apply() = new SttpClient()
}

```

In the event that the STTP library goes EOL, we would need to:

1. Implement a new authentication wrapper for the replacement library.
2. Implement the new library's client (similar to `SttpClient`).
3. Update the `apply()` method in `ApiClient` to return an instance of the new client. This single-line change ensures that no other classes are impacted by the transition.

Using the client
----------------

With the foundational components in place, we can now use the `ApiClient` to make an HTTP call. Here's an example of how to perform an API call using the implemented code:

```scala
val request = ApiRequestBuilder()
  .withUrl(url)
  .withMethod(POST)        // Refers to the case object POST created above
  .withAuthentication(TokenAuth(token))
  .withBody(JsonBody("""{"key":"value"}"""))
  .build()

ApiClient().send(request) match {
  case Left(value) =>
    throw new Exception(value.body.get)
  case Right(ApiResponse(_, body, _)) =>
    println(body.get)
    println("API Call successful")
}

```

Note the use of `ApiClient()` to initiate the HTTP call. In Scala, `ApiClient()` is syntactic sugar that the compiler interprets as a call to the `ApiClient.apply()` method.

Adherence to SOLID Principles
-----------------------------

[SOLID](https://en.wikipedia.org/wiki/SOLID) is a set of five principles of Object-Oriented class design. They are a set of rules and best practices to follow while designing a class structure. These five principles help us understand the need for certain design patterns and software architecture in general. I always strive to adhere to these principles whenever I'm developing software, and we will now have a look at how the code above adheres to the SOLID Principles.

### **S**ingle Responsibility Principle (SRP)

A class should have one, and only one, reason to change. This principle promotes the separation of concerns within a system:

* Our `HttpRequestBuilder` is solely responsible for building `HttpRequest` objects. It encapsulates the construction logic and provides an interface for setting request properties.
* The `BodyParser` isolates the logic for parsing different types of response bodies based on the content type, keeping this concern separate from other parts of the system
* Our `SttpClient` implementation handles the responsibility of sending HTTP requests and processing responses. It doesn't concern itself with the construction of requests or parsing of response bodies, which are handled by other classes.
* `ApiResponse` encapsulates the response data, separating it from the request logic and the client implementation.
* `ApiAuth` and its various subclasses have a single responsibility to apply a specific authentication mechanism.

### **O**pen/Closed Principle (OCP)

Software entities should be open for extension but closed for modification. This means you can extend the behavior of a class without modifying its source code:

* The `Body` trait and its subclasses allow for easy addition of new body types without altering existing code. For example, adding a new `CsvBody` would involve creating a new case class that extends `Body`.
* New implementations of `ApiClient` can be created (e.g., `JavaApiClient`, `Http4sApiClient`) without modifying the existing `SttpClient`. Each new client implementation can provide its own logic for sending requests.
* New authentication methods can be added by creating new classes that implement the `Authentication` trait.

### **L**iskov Substitution Principle (LSP)

Objects of a superclass should be replaceable with objects of a subclass without affecting the correctness of the program:

* Anywhere a `Body` is expected, any of its subclasses (`JsonBody`, `XmlBody`, etc.) can be used interchangeably.
* The system can use `TokenAuthentication` or `BasicAuthentication` interchangeably wherever `Authentication` is expected, ensuring the `applyTo` method works correctly for any subclass.

### **I**nterface Segregation Principle (ISP)

No client should be forced to depend on methods it does not use. This principle advocates for smaller, more specific interfaces:

* `ApiAuth` **Interface**: This interface is specifically for adding authentication to a request and does not include other unrelated methods. It ensures that only relevant methods are exposed to classes that implement this interface.
* `ApiClient` **Interface**: Defines a minimal interface for sending HTTP requests. It does not force implementing classes to expose unnecessary methods.

### **D**ependency Inversion Principle (DIP)

High-level modules should not depend on low-level modules. Both should depend on abstractions. Abstractions should not depend on details. Details should depend on abstractions:

* `ApiClient` **Interface**: The high-level code (such as a service using the HTTP client) depends on the `ApiClient` abstraction, not on specific implementations like `SttpClient`.
* **Dependency on Abstractions**: The system uses the `ApiAuth`, `ApiBody`, and `ApiClient` abstractions rather than concrete implementations, making it easy to swap out implementations as needed.

Conclusion
----------

The goal was to modernize our HTTP client classes, moving from a rigid, outdated pieces to a flexible, modular architecture. By focusing on a clean separation of concerns and employing design patterns like Builder, Factory and Singleton, we created a robust framework that enhances maintainability and scalability.

Key features include a modular request builder, an extensible authentication wrapper, and a consistent handling of API responses. The new design ensures easy adaptability to future changes, such as switching out libraries or updating security protocols, with minimal impact on the overall system.

This streamlined, adaptable architecture not only addresses previous limitations but also positions our product for future growth and technological advancements.

Code used inside this post is also available inside my [GitHub repo](https://github.com/Sparker0i/API-Scala-with-SOLID-Principles).
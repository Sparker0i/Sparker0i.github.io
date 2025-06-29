---
date: '2025-05-12T07:43:20.580Z'
description: Practical Techniques for Spotting Bad Code Patterns and Cleaning Up Your
  Codebase
image: 6821a6985006bd988f7f9344.png
lastmod: '2025-05-12T08:56:26.768Z'
slug: identify-and-refactor-code-smells-for-better-code-quality
tags:
- Code Smells
- Refactor
- Clean Code
- Software Architecture
categories:
- Clean Code
- Software Architecture
title: How to Identify and Refactor Code Smells for Better Code Quality
---

Code is more than just instructions for a machine - it's a form of communication with your future self and teammates. Yet all too often, codebases accumulate hidden "stinkers" that slow down development, introduce bugs, and frustrate newcomers. These are **code smells**: surface indicators that something deeper in the design or implementation needs attention. In this post, we'll explore a comprehensive catalog of common smells and walk through concrete refactoring - complete with before/after snippets (in Go, but the logic can be applied to any language)- to help you keep your codebase clean, maintainable, and a joy to work with.

Why Code Smells matter?
-----------------------

* **Readability & Onboarding**: Long, tangled methods or duplicated logic force readers to mentally untangle intent from implementation. New team members spend hours deciphering what should've been clear.
* **Bug Rate**: Smelly code often has hidden dependencies or unexpected side effects. One small change can ripple out, breaking functionality in multiple places.
* **Confidence to Change**: When refactoring feels risky, teams delay improvements, leading to technical debt escalation. Over time, even minor enhancements require heroic effort.

> **Personal Anecdote**: During the early stages of my career I inherited a 5k line class handling everything from fetching data then transforming it and loading it somewhere. This class was growing exponentially with every sprint/iteration, and soon risked crossing 10k lines. Every change required a full regression suite and lots of manual testing. After identifying just three key smells - Long Method, Feature Envy, and Primitive Obsession - we applied targeted refactorings that reduced that class to under 1000 lines and we were easily able to extend our codebase.

**Basic Code Smells & Refactorings**
------------------------------------

### Long Method

**What it is:** A method or function that spans many lines - often 200+ - and tries to do too much: input validation, business logic, data transformation, persistence, side-effects, and user interaction all in one place.

**Why it matters**

* **Cognitive Load**: Readers must keep many moving parts and intents in mind at once.
* **Hard to Test**: You can't isolate pieces easily for unit tests.
* **Change Risk**: A tweak for one concern can inadvertently break another.

**How to spot it**

* Look for methods longer than a screen.
* Multiple comments like // validate, // compute, // persist in one block.
* Deep nesting of conditionals and loops.

**Refactoring**: Use Extract Method

1. Identify a coherent chunk: it does one logical sub-task.
2. Give it a descriptive name.
3. Replace the chunk with a call to the new method.

Example: Before

```
func Checkout(cart Cart) {
    // 1. Validate
    if len(cart.Items) == 0 { log.Error("empty cart"); return }
    // 2. Sum prices
    sum := 0.0
    for _, i := range cart.Items { sum += i.Price * float64(i.Qty) }
    // 3. Apply discount
    if cart.Customer.IsVIP { sum *= 0.9 }
    // 4. Log & persist
    log.Printf("Total: %.2f", sum)
    db.Save(cart, sum)
    // 5. Send email
    emailService.Send(cart.Customer.Email, sum)
}

```

Example: After

```
func Checkout(cart Cart) {
    if err := validate(cart); err != nil {
        log.Error(err); return
    }
    total := calculateTotal(cart.Items)
    total = applyDiscount(total, cart.Customer)
    finalizeOrder(cart, total)
}

func validate(cart Cart) error {
    if len(cart.Items) == 0 { return fmt.Errorf("cart empty") }
    return nil
}

func calculateTotal(items []Item) float64 { ... }

func applyDiscount(total float64, c Customer) float64 { ... }

func finalizeOrder(cart Cart, total float64) {
    log.Printf("Total: %.2f", total)
    db.Save(cart, total)
    emailService.Send(cart.Customer.Email, total)
}

```

### Duplicated Code

**What it is**: Slivers of nearly identical logic appear in two or more locations - copy-paste programming.

**Why it matters**

* **Maintenance Hell**: Fixing a bug requires updating every copy.
* **Divergence**: Over time, copies drift apart, hiding inconsistent behavior.

**How to spot it**

* Search for the same loop, conditional, or calculation in multiple files.
* In code reviews, ask "Have we done this before?"

**Refactoring Options**

* Pull shared logic into a single helper function.
* Replace all occurrences with calls to that helper

Example: Before

```
func CalculateTaxA(order Order) float64 {
    tax := 0.0
    for _, item := range order.Items {
        tax += item.Price * float64(item.Quantity) * 0.08
    }
    return tax
}

func CalculateTaxB(invoice Invoice) float64 {
    tax := 0.0
    for _, line := range invoice.Lines {
        tax += line.UnitPrice * float64(line.Count) * 0.08
    }
    return tax
}

```

Example: After

```
func calculateTax(subtotal float64) float64 {
    return subtotal * 0.08
}

func CalculateTaxA(order Order) float64 {
    subtotal := sumPrices(order.Items)
    return calculateTax(subtotal)
}

func CalculateTaxB(inv Invoice) float64 {
    subtotal := sumInvoiceLines(inv.Lines)
    return calculateTax(subtotal)
}

// Shared helpers
func sumPrices(items []Item) float64 {
    total := 0.0
    for _, i := range items {
        total += i.Price * float64(i.Quantity)
    }
    return total
}

func sumInvoiceLines(lines []Line) float64 {
    total := 0.0
    for _, l := range lines {
        total += l.UnitPrice * float64(l.Count)
    }
    return total
}

```

### Long Parameter List

**What it is**: Methods that accept many parameters - often over five - making calls verbose and error-prone.

**Why it matters**

* Hard to Remember Order: Callers mix up parameters.
* **Low Cohesion**: Signals multiple responsibilities or data clumps.

**How to spot it**

* Method signatures with more than 4 arguments.
* Frequent use of null or default values to skip parameters.

**Refactoring**: Introduce Parameter Object

1. Identify parameters that form a logical group.
2. Create a class/struct to hold them.
3. Replace the parameter list with the new object.

Example: Before

```
func CreateUser(firstName, lastName, email, phone, role string, isActive bool) {
    // ...
}

```

After:

```
type CreateUserRequest struct {
    FirstName string
    LastName  string
    Email     string
    Phone     string
    Role      string
    IsActive  bool
}

func CreateUser(req CreateUserRequest) {
    // ...
}

```

### Divergent Change

**What it is**: A single class or module is edited for many unrelated reasons--bug fixes, UI tweaks, business-rule updates--indicating mixed responsibilities.

**Why it matters**

* **Fragile**: Changes for one concern can break another.
* **Violates SRP**: Violates the Single Responsibility Principle.

**How to spot it**

* Version-control history shows one file modified by many tickets of different types.
* Code reviewers comment: "Why are we touching this here?"

**Refactoring**

* Identify distinct responsibilities and extract them into new types.
* Move methods closer to the data they operate on.

Example: Before - one class handles both user validation and reporting logic:

```
type UserService struct{}

func (s *UserService) Validate(u User) error {
    if u.Email == "" {
        return fmt.Errorf("email required")
    }
    // ... many more checks ...
    return nil
}

func (s *UserService) GenerateReport(u User) Report {
    // mixing data access and formatting...
    return Report{/* ... */}
}

```

Example: After - split responsibilities into two classes:

```
type UserValidator struct{}

func (v *UserValidator) Validate(u User) error {
    if u.Email == "" {
        return fmt.Errorf("email required")
    }
    // ... other checks ...
    return nil
}

type UserReportService struct{}

func (r *UserReportService) Generate(u User) Report {
    report := Report{/* ... focused report generation... */}
    return report
}

```

### Feature Envy

**What it is**: A method in one type heavily accesses fields or methods of another type - more than its own - indicating misplaced behavior.

**Why it matters**

* **Tight Coupling**: Class A becomes tightly coupled to B's internals.
* **Poor Encapsulation**: Behavior isn't located where the data resides.

**How to spot it**

* A method's code reads like b.getX(), b.getY(), b.computeZ() repeatedly.

**Refactoring**

* **Move Method**: Shift the method into Class B.
* **Extract Method**: If only part of the code envies B, extract that fragment into a helper on B.

Example: Before - a method in `InvoiceService` reaching into `Order` internals:

```
type InvoiceService struct{}

func (s *InvoiceService) TotalWithTax(o Order) float64 {
    sum := 0.0
    for _, item := range o.Items {
        sum += item.Price * float64(item.Quantity)
    }
    rate := o.Customer.State.TaxRate
    return sum * (1 + rate)
}

```

Example: After - move the logic into `Order`:

```
func (o Order) TotalWithTax() float64 {
    sum := 0.0
    for _, item := range o.Items {
        sum += item.Price * float64(item.Quantity)
    }
    return sum * (1 + o.Customer.State.TaxRate)
}

type InvoiceService struct{}

func (s *InvoiceService) TotalWithTax(o Order) float64 {
    return o.TotalWithTax()
}

```

### Shotgun Surgery

**What it is**: A small change requires edits in many different places - scattered across classes or modules.

**Why it matters**

* **Error-Prone**: Easy to miss one location.
* **Discourages Change**: Teams avoid improvements.

**How to spot it**: Search-and-replace touches dozens of files for a single concept.

**Refactoring**

* **Introduce Facade**: Centralize calls behind one interface.
* **Move Related Behavior**: Co-locate methods and data so that a change is

Example: Before

```
func OnboardUser(userID string) {
    data := db.FetchUserData(userID)
    processed := processor.Process(data)
    notifier.SendWelcome(userID, processed.Summary)
}

```

Example: After

```
type OnboardingFacade struct {
    DB        Database
    Processor Processor
    Notifier  Notifier
}

func (f *OnboardingFacade) Onboard(userID string) {
    data := f.DB.FetchUserData(userID)
    summary := f.Processor.Process(data).Summary
    f.Notifier.SendWelcome(userID, summary)
}

// Client:
facade := OnboardingFacade{db, processor, notifier}
facade.Onboard("user123")

```

### Primitive Obsession

**What it is**: Overusing built-in types (String, int, bool) for domain concepts instead of small dedicated classes or value objects.

**Why it matters**

* **Scattering of Validation**: Every user-input string is validated in ad-hoc ways.
* **Duplication**: Parsing and formatting logic repeated.

**How to spot it**

* Method signatures full of String parameters representing distinct concepts (e.g., email, phone, address).

**Refactoring**

* Replace Primitive with Value Object: Create classes like `EmailAddress`, `PhoneNumber` that encapsulate format checks and domain logic.

Example: Before

```
func ConvertAmount(amount float64, fromCurrency, toCurrency string) float64 {
    rate := lookupRate(fromCurrency, toCurrency)
    return amount * rate
}

```

Example: After

```
type Currency string

func (c Currency) RateTo(other Currency) float64 {
    return lookupRate(string(c), string(other))
}

func ConvertAmount(amount float64, from, to Currency) float64 {
    return amount * from.RateTo(to)
}

```

### Replace Temp with Query

**What it is**: Temporary variables hold intermediate calculation results, cluttering the method body.

**Why it matters**

* **Readability**: Readers must track variables and their transformations.
* **Duplication**: The same calculation might reappear elsewhere.

**How to spot it**

* Sequences like temp = expr; ... use temp; ... modify temp.

**Refactoring**

* Encapsulate the expression in a well-named query method, then call it directly.

Example: Before

```
func FinalPrice(o Order) float64 {
    basePrice := float64(o.Quantity) * o.UnitPrice
    discount := 0.0
    if basePrice > 1000 {
        discount = basePrice * 0.05
    }
    return basePrice - discount
}

```

Example: After

```
func FinalPrice(o Order) float64 {
    return calculateBase(o) - calculateDiscount(o)
}

func calculateBase(o Order) float64 {
    return float64(o.Quantity) * o.UnitPrice
}

func calculateDiscount(o Order) float64 {
    base := calculateBase(o)
    if base > 1000 {
        return base * 0.05
    }
    return 0
}

```

### Replace Conditional with Polymorphism

**What it is**: Extensive `if-else` or `switch` blocks that dispatch based on type codes or flags.

**Why it matters**

* **Open/Closed Violation**: Every time you add a new type, you modify the conditional.
* **Readability**: Logic spread across a tangled conditional.

**How to spot it**

* Large switch(order.type) { case A:...; case B:... } constructs.

**Refactoring**

* Strategy Pattern or Class Hierarchy: Define a common interface and let each subtype implement its behavior.

Example: Before

```
func SendNotification(u User, method string) {
    if method == "email" {
        sendEmail(u.Email, "Hello!")
    } else if method == "sms" {
        sendSMS(u.Phone, "Hello!")
    } else if method == "push" {
        sendPush(u.DeviceToken, "Hello!")
    }
}

```

Example: After

```
type Notifier interface {
    Notify(User)
}

type EmailNotifier struct{}
func (EmailNotifier) Notify(u User) { sendEmail(u.Email, "Hello!") }

type SMSNotifier struct{}
func (SMSNotifier) Notify(u User) { sendSMS(u.Phone, "Hello!") }

type PushNotifier struct{}
func (PushNotifier) Notify(u User) { sendPush(u.DeviceToken, "Hello!") }

var notifierMap = map[string]Notifier{
    "email": EmailNotifier{},
    "sms":   SMSNotifier{},
    "push":  PushNotifier{},
}

func SendNotification(u User, method string) {
    if n, ok := notifierMap[method]; ok {
        n.Notify(u)
    }
}

```

### Data Clumps

**What it is**: Groups of variables that always appear together--e.g., x, y, z coordinates, street, city, zip.

**Why it matters**

* **Duplication**: Same parameter list repeated.
* **Cohesion**: Related data isn't grouped.

**How to spot it**

* Method after method accepting the same set of parameters.

**Refactoring**

* Introduce Parameter Object or Data Class to bundle related fields into one type.

Example: Before

```
func DrawLine(x1, y1, x2, y2 float64, color string) {
    ctx.SetStrokeColor(color)
    ctx.MoveTo(x1, y1)
    ctx.LineTo(x2, y2)
    ctx.Stroke()
}

```

Example: After

```
type Point struct{ X, Y float64 }

func DrawLine(p1, p2 Point, color string) {
    ctx.SetStrokeColor(color)
    ctx.MoveTo(p1.X, p1.Y)
    ctx.LineTo(p2.X, p2.Y)
    ctx.Stroke()
}

// Usage
DrawLine(Point{10, 20}, Point{30, 40}, "red")

```

General Refactoring Best Practices
----------------------------------

1. **Test Coverage First**: Ensure you have reliable unit and integration tests before refactoring.
2. **Tiny, Safe Steps**: Change one thing at a time; run tests after each change to catch regressions early.
3. **IDE Assistance**: Leverage built-in refactorings - Extract Method, Rename, Inline - to minimize manual edits.
4. **Code Reviews with Smell Checks**: Add "smell spotting" to your review checklist to catch issues collaboratively.
5. **Continuous Refactoring**: Make cleanup part of your regular workflow and Definition of Done, not a separate "cleanup sprint."

Conclusion
----------

Code smells are inevitable, but they need not become insurmountable technical debt. By recognizing these ten patterns and applying targeted refactorings, you'll cultivate a codebase that's more understandable, safer to change, and more enjoyable for your entire team. Start small, build momentum with quick wins like Extract Method, then tackle more advanced refactorings. Your future self (and teammates) will thank you.
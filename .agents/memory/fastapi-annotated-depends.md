---
name: FastAPI Annotated + Depends conflict
description: Annotated[T, Depends(fn)] params must NOT have a default value; causes AssertionError at startup.
---

**Rule:** When a dependency is declared as `CurrentUser = Annotated[User, Depends(get_current_user)]`, endpoint parameters must use it bare — `current_user: CurrentUser` — never with a redundant default like `current_user: CurrentUser = Depends()`.

**Why:** FastAPI raises `AssertionError: Cannot specify Depends in Annotated and default value together` during router registration, crashing the server before it serves any requests.

**How to apply:** Any endpoint that uses an `Annotated` type alias that already embeds `Depends()` must place that parameter at the top of the signature with no default. Form/File parameters (which require defaults) should follow it.

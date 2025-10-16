# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - alert [ref=e2]
  - generic [ref=e4]:
    - generic [ref=e5]:
      - heading "Welcome to 1001 Stories" [level=1] [ref=e6]
      - paragraph [ref=e7]: Discover and share stories from cultures around the world
    - generic [ref=e9]:
      - button "Magic Link" [ref=e10] [cursor=pointer]
      - button "Password" [ref=e11] [cursor=pointer]
    - generic [ref=e12]:
      - paragraph [ref=e13]: Sign in with your preferred method
      - button "Sign in with Google" [ref=e14] [cursor=pointer]:
        - generic [ref=e15] [cursor=pointer]: 🔍
        - generic [ref=e16] [cursor=pointer]: Continue with Google
      - button "Sign in with GitHub" [ref=e17] [cursor=pointer]:
        - generic [ref=e18] [cursor=pointer]: 📱
        - generic [ref=e19] [cursor=pointer]: Continue with GitHub
    - generic [ref=e24]: or continue with email
    - generic [ref=e25]:
      - generic [ref=e26]:
        - generic [ref=e27]: Email Address
        - textbox "Email Address" [ref=e28]
      - button "Sign in to your account" [ref=e29] [cursor=pointer]: Send Magic Link
    - paragraph [ref=e31]:
      - text: Don't have an account?
      - link "Create one here" [ref=e32] [cursor=pointer]:
        - /url: /signup
    - paragraph [ref=e34]: 🌍 Join storytellers from around the world in preserving and sharing cultural heritage
```
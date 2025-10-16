# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - generic [ref=e4]:
      - heading "Welcome to 1001 Stories" [level=1] [ref=e5]
      - paragraph [ref=e6]: Discover and share stories from cultures around the world
    - generic [ref=e8]:
      - button "Magic Link" [ref=e9] [cursor=pointer]
      - button "Password" [ref=e10] [cursor=pointer]
    - generic [ref=e11]:
      - paragraph [ref=e12]: Sign in with your preferred method
      - button "Sign in with Google" [ref=e13] [cursor=pointer]:
        - generic [ref=e14] [cursor=pointer]: 🔍
        - generic [ref=e15] [cursor=pointer]: Continue with Google
      - button "Sign in with GitHub" [ref=e16] [cursor=pointer]:
        - generic [ref=e17] [cursor=pointer]: 📱
        - generic [ref=e18] [cursor=pointer]: Continue with GitHub
    - generic [ref=e23]: or continue with email
    - generic [ref=e24]:
      - generic [ref=e25]:
        - generic [ref=e26]: Email Address
        - textbox "Email Address" [ref=e27]
      - button "Sign in to your account" [ref=e28] [cursor=pointer]: Send Magic Link
    - paragraph [ref=e30]:
      - text: Don't have an account?
      - link "Create one here" [ref=e31] [cursor=pointer]:
        - /url: /signup
    - paragraph [ref=e33]: 🌍 Join storytellers from around the world in preserving and sharing cultural heritage
  - alert [ref=e34]
```
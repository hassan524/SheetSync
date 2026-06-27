# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in SheetSync, please **do not open a public GitHub issue**.

Instead, email me at **hassanrehan9975@gmail.com** or open a [GitHub Security Advisory](https://github.com/hassan524/sheetsync/security/advisories/new) (private disclosure).

Please include:

- Description of the vulnerability
- Steps to reproduce
- Potential impact

You'll get a response within 48 hours. I take security seriously and will address valid reports promptly.

## What's in Scope

- Authentication bypasses
- RLS policy bypasses that expose other users' data
- XSS vulnerabilities
- Data exposure bugs

## What's Out of Scope

- Issues requiring physical access to a device
- Social engineering attacks
- Rate limiting on non-sensitive endpoints

## Supabase & RLS

SheetSync uses Supabase Row-Level Security to ensure users can only access their own data and sheets they've been explicitly granted access to. If you find an RLS bypass, that is a high-priority report.

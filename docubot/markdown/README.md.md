# Docubot

## Summary
Docubot is a bot that helps you document your code. It uses AnswerAI to chat with you and save your code into memory.

## Usage
To use Docubot, you need to install it and then run it. Once it's running, you can chat with it using AnswerAI.

```bash
npm install docubot
docubot start
docubot start /path/to/file
```

## Commands
Docubot has several commands that you can use to interact with it.

### `docubot save`
The `save` command allows you to save your code into pinecone memory

```bash
docubot save 
```

### `docubot list`
The `list` command allows you to list all of the files that you have saved.

```bash
docubot list
```

## List of Questions
- How do I install Docubot?
- How do I start Docubot?
- What commands does Docubot have?
- How do I save my code with Docubot?
- How do I list all of my saved code with Docubot?
- How do I delete a file or directory from my saved code with Docubot?

## List of Resources
- Docubot can be used to document your code and make it easier to search and manage.

## TODO
- Fix the pricing per token so that it can be the estimated amount, then return the final amount from OpenAI
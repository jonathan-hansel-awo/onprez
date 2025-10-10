// This file has intentionally bad formatting
// Run: npm run format
// To see it get automatically fixed!

const user = { name: 'John', age: 30, email: 'john@example.com' }

function processUser(data: any) {
  const result = data.name + ' is ' + data.age + ' years old'
  return result
}

const numbers = [1, 2, 3, 4, 5].map(n => n * 2).filter(n => n > 5)

console.log(processUser(user))
console.log(numbers)

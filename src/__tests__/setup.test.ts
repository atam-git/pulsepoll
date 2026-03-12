/**
 * Basic setup test to verify testing infrastructure
 */
describe('Project Setup', () => {
  it('should have a working test environment', () => {
    expect(true).toBe(true)
  })

  it('should have environment variables configured', () => {
    // Test that we can access environment variables
    expect(process.env.NODE_ENV).toBeDefined()
  })

  it('should support TypeScript', () => {
    const testObject: { name: string; value: number } = {
      name: 'test',
      value: 42
    }
    
    expect(testObject.name).toBe('test')
    expect(testObject.value).toBe(42)
  })
})
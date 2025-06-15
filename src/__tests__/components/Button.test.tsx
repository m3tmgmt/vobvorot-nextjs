import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '@/components/ui/button'

describe('Button Component', () => {
  it('renders button with text', () => {
    render(<Button>Click me</Button>)
    const button = screen.getByRole('button', { name: /click me/i })
    expect(button).toBeInTheDocument()
  })
  
  it('handles click events', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Click me</Button>)
    
    const button = screen.getByRole('button', { name: /click me/i })
    fireEvent.click(button)
    
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
  
  it('can be disabled', () => {
    render(<Button disabled>Disabled Button</Button>)
    const button = screen.getByRole('button', { name: /disabled button/i })
    
    expect(button).toBeDisabled()
  })
  
  it('applies different variants', () => {
    const { rerender } = render(<Button variant="default">Default</Button>)
    let button = screen.getByRole('button', { name: /default/i })
    expect(button).toHaveClass('bg-primary')
    
    rerender(<Button variant="destructive">Destructive</Button>)
    button = screen.getByRole('button', { name: /destructive/i })
    expect(button).toHaveClass('bg-destructive')
    
    rerender(<Button variant="outline">Outline</Button>)
    button = screen.getByRole('button', { name: /outline/i })
    expect(button).toHaveClass('border')
  })
  
  it('applies different sizes', () => {
    const { rerender } = render(<Button size="default">Default Size</Button>)
    let button = screen.getByRole('button', { name: /default size/i })
    expect(button).toHaveClass('h-9')
    
    rerender(<Button size="sm">Small</Button>)
    button = screen.getByRole('button', { name: /small/i })
    expect(button).toHaveClass('h-8')
    
    rerender(<Button size="lg">Large</Button>)
    button = screen.getByRole('button', { name: /large/i })
    expect(button).toHaveClass('h-10')
  })
})
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../Button';

describe('Button', () => {
  it('渲染默认按钮', () => {
    render(<Button>点击</Button>);
    const btn = screen.getByRole('button', { name: '点击' });
    expect(btn).toBeInTheDocument();
    expect(btn).not.toBeDisabled();
    expect(btn).toHaveAttribute('type', 'button');
  });

  it('primary 变体渲染', () => {
    render(<Button variant="primary">主要按钮</Button>);
    const btn = screen.getByText('主要按钮');
    expect(btn).toBeInTheDocument();
  });

  it('danger 变体渲染', () => {
    render(<Button variant="danger">删除</Button>);
    const btn = screen.getByText('删除');
    expect(btn).toBeInTheDocument();
  });

  it('ghost 变体渲染', () => {
    render(<Button variant="ghost">取消</Button>);
    expect(screen.getByText('取消')).toBeInTheDocument();
  });

  it('不同尺寸渲染', () => {
    const { rerender } = render(<Button size="sm">小</Button>);
    expect(screen.getByText('小')).toBeInTheDocument();

    rerender(<Button size="lg">大</Button>);
    expect(screen.getByText('大')).toBeInTheDocument();
  });

  it('点击触发 onClick', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>点击</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('disabled 状态不触发点击', () => {
    const handleClick = vi.fn();
    render(<Button disabled onClick={handleClick}>禁用</Button>);
    const btn = screen.getByRole('button');
    expect(btn).toBeDisabled();
    fireEvent.click(btn);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('loading 状态不触发点击且按钮禁用', () => {
    const handleClick = vi.fn();
    render(<Button loading onClick={handleClick}>加载中</Button>);
    const btn = screen.getByRole('button');
    expect(btn).toBeDisabled();
    fireEvent.click(btn);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('loading 状态显示加载动画', () => {
    render(<Button loading>加载中</Button>);
    const btn = screen.getByRole('button');
    // 验证加载指示器（旋转的 span）存在
    const spinner = btn.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('fullWidth 属性', () => {
    render(<Button fullWidth>全宽</Button>);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('w-full');
  });

  it('自定义 className', () => {
    render(<Button className="my-custom">自定义</Button>);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('my-custom');
  });

  it('自定义 type 属性', () => {
    render(<Button type="submit">提交</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
  });

  it('title 属性设置', () => {
    render(<Button title="提示文本">按钮</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('title', '提示文本');
  });

  it('正确渲染 children', () => {
    render(
      <Button>
        <span data-testid="icon">🔍</span>
        搜索
      </Button>,
    );
    expect(screen.getByTestId('icon')).toBeInTheDocument();
    expect(screen.getByText('搜索')).toBeInTheDocument();
  });

  it('默认 variant 为 secondary', () => {
    render(<Button>默认</Button>);
    const btn = screen.getByRole('button');
    // secondary 变体应该有 border 相关的类
    expect(btn.className).toContain('border');
  });

  it('默认 size 为 md', () => {
    render(<Button>默认大小</Button>);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('h-10');
    expect(btn.className).toContain('px-4');
  });
});

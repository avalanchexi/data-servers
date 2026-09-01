import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { Cascader, type CascaderOption } from '../Cascader';

const options: CascaderOption[] = [
  {
    value: 'root',
    label: '北京东方金信',
    children: [
      { value: 'child', label: '研发部' },
    ],
  },
];

describe('Cascader', () => {
  it('leaf 模式只显示最终选中子组织名称', () => {
    render(
      <Cascader
        options={options}
        value={['root', 'child']}
        displayMode="leaf"
        placeholder="全部组织"
      />,
    );
    expect(screen.getByRole('button', { name: /研发部/ })).toHaveTextContent('研发部');
    expect(screen.getByRole('button', { name: /研发部/ })).not.toHaveTextContent('北京东方金信');
  });

  it('默认 full 模式显示完整路径', () => {
    render(
      <Cascader
        options={options}
        value={['root', 'child']}
        placeholder="全部组织"
      />,
    );
    expect(screen.getByRole('button', { name: /北京东方金信 \/ 研发部/ })).toHaveTextContent('北京东方金信 / 研发部');
  });

  it('路径不完整时回退 placeholder（原 bug 场景）', () => {
    render(
      <Cascader
        options={options}
        value={['child']}
        displayMode="leaf"
        placeholder="全部组织"
      />,
    );
    expect(screen.getByRole('button', { name: '全部组织' })).toHaveTextContent('全部组织');
  });

  it('点击清除时 onChange 收到空路径', () => {
    const handleChange = vi.fn();
    render(
      <Cascader
        options={options}
        value={['root', 'child']}
        displayMode="leaf"
        placeholder="全部组织"
        onChange={handleChange}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: '清除选择' }));
    expect(handleChange).toHaveBeenCalledWith([], expect.any(Array));
  });
});

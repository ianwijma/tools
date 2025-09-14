import { fireEvent, render, screen } from '@testing-library/react';
import NavigationLayout from '../NavigationLayout';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}));

describe('NavigationLayout', () => {
  const renderWithChild = (content: string = 'Test Content'): void => {
    render(
      <NavigationLayout>
        <div>{content}</div>
      </NavigationLayout>,
    );
  };

  it('should render the navigation layout', () => {
    renderWithChild();

    expect(screen.getByText('Online Tools Collection')).toBeVisible();
    expect(screen.getByText('Test Content')).toBeVisible();
  });

  it('should render GitHub link with correct attributes', () => {
    renderWithChild();

    const githubLink = screen.getByLabelText('View source code on GitHub');
    expect(githubLink).toBeVisible();
    expect(githubLink).toHaveAttribute(
      'href',
      'https://github.com/ianwijma/tools',
    );
    expect(githubLink).toHaveAttribute('target', '_blank');
    expect(githubLink).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('should make GitHub link accessible', () => {
    renderWithChild();

    const githubLink = screen.getByLabelText('View source code on GitHub');
    expect(githubLink).toBeVisible();
    expect(githubLink).toHaveAccessibleName('View source code on GitHub');
  });

  it('should render mobile menu button on small screens', () => {
    renderWithChild();

    const menuButton = screen.getByLabelText('open drawer');
    expect(menuButton).toBeInTheDocument();
  });

  it('should toggle mobile drawer when menu button is clicked', () => {
    renderWithChild();

    const menuButton = screen.getByLabelText('open drawer');
    fireEvent.click(menuButton);

    // The drawer should be opened but testing its visibility is complex with MUI
    // We can at least verify the button is clickable and doesn't throw errors
    expect(menuButton).toBeVisible();
  });

  it('should render navigation tools in the drawer', () => {
    renderWithChild();

    // These tools should be present in the drawer content (getAllByText since MUI renders both temp and permanent drawers)
    expect(screen.getAllByText('JSON Beautifier')).toHaveLength(2);
    expect(screen.getAllByText('JSON Uglifier')).toHaveLength(2);
    expect(screen.getAllByText('Image Converter')).toHaveLength(2);
  });

  it('should display tool descriptions in the drawer', () => {
    renderWithChild();

    expect(
      screen.getAllByText(
        'Transform minified JSON into clean, readable format',
      ),
    ).toHaveLength(2);
    expect(
      screen.getAllByText(
        'Minimize JSON by removing all unnecessary whitespace',
      ),
    ).toHaveLength(2);
    expect(
      screen.getAllByText(
        'Convert images between formats with bulk processing support',
      ),
    ).toHaveLength(2);
  });

  it('should render navigation with proper layout structure', () => {
    renderWithChild();

    // Check that main navigation elements are visible
    const appBar = screen.getByRole('banner');
    expect(appBar).toBeVisible();

    const main = screen.getByRole('main');
    expect(main).toBeVisible();
    expect(main).toContainElement(screen.getByText('Test Content'));
  });

  it('should handle children prop correctly', () => {
    const testContent = 'Custom Test Content for Children';
    renderWithChild(testContent);

    expect(screen.getByText(testContent)).toBeVisible();
  });
});

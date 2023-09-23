import * as React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ComponentClassName } from '@aws-amplify/ui';
import { DEFAULT_ROW_COUNT, TextAreaField } from '../TextAreaField';
import {
  testFlexProps,
  expectFlexContainerStyleProps,
} from '../../Flex/__tests__/Flex.test';
import { AUTO_GENERATED_ID_PREFIX } from '../../utils/useStableId';

const label = 'Field';
const testId = 'testId';
describe('TextAreaField component', () => {
  describe('wrapper Flex', () => {
    it('should render default and custom classname', async () => {
      const customClassName = 'my-textareafield';
      render(
        <TextAreaField
          label={label}
          id="testField"
          testId={testId}
          className={customClassName}
        />
      );

      const field = await screen.findByTestId(testId);
      expect(field).toHaveClass(customClassName);
      expect(field).toHaveClass(ComponentClassName.Field);
      expect(field).toHaveClass(ComponentClassName.TextAreaField);
    });

    it('should render all flex style props', async () => {
      render(
        <TextAreaField testId="testId" label="field" {...testFlexProps} />
      );
      const field = await screen.findByTestId('testId');
      expectFlexContainerStyleProps(field);
    });
  });

  describe('Label', () => {
    it('should render expected field classname', async () => {
      render(<TextAreaField label="Field" />);

      const label = await screen.findByText('Field');
      expect(label).toHaveClass(ComponentClassName.Label);
    });

    it('should have `amplify-visually-hidden` class when labelHidden is true', async () => {
      render(<TextAreaField label="Search" labelHidden />);

      const label = await screen.findByText('Search');
      expect(label).toHaveClass('amplify-visually-hidden');
    });
  });

  describe('TextArea field', () => {
    it('should render labeled textarea when id is provided', async () => {
      render(
        <TextAreaField
          label={label}
          id="testField"
          defaultValue="Hello there"
        />
      );
      const field = await screen.findByLabelText(label);
      expect(field.tagName).toBe('TEXTAREA');
      expect(field).toHaveClass(ComponentClassName.Textarea);
      expect(field.id).toBe('testField');
    });

    it('should forward ref to DOM element', async () => {
      const ref = React.createRef<HTMLTextAreaElement>();
      render(<TextAreaField label={label} ref={ref} />);

      await screen.findByLabelText(label);
      expect(ref?.current?.nodeName).toBe('TEXTAREA');
    });

    it('should render labeled input when id is not provided, and is autogenerated', async () => {
      render(<TextAreaField label={label} defaultValue="Hello there" />);
      const field = await screen.findByLabelText(label);
      expect(field.id.startsWith(AUTO_GENERATED_ID_PREFIX)).toBe(true);
      expect(field).toHaveClass(ComponentClassName.Textarea);
    });

    it('should render the state attributes', async () => {
      render(
        <TextAreaField
          label="Field"
          size="small"
          defaultValue=""
          hasError
          isDisabled
          isReadOnly
          isRequired
        />
      );

      const field = await screen.findByRole('textbox');
      expect(field).toHaveAttribute('disabled', '');
      expect(field).toHaveAttribute('readonly', '');
      expect(field).toHaveAttribute('required', '');
      expect(field).toHaveAttribute('rows', DEFAULT_ROW_COUNT.toString());
    });

    it('should render the rows attributes', async () => {
      const rowCount = 10;

      render(<TextAreaField label="Field" rows={rowCount} />);

      const field = await screen.findByRole('textbox');
      expect(field).toHaveAttribute('rows', String(rowCount));
    });

    it('should set size and variation classes', async () => {
      render(
        <TextAreaField
          label="Field"
          size="small"
          testId="testField"
          variation="quiet"
        />
      );

      const textAreaField = await screen.findByTestId('testField');
      const textArea = await screen.findByRole('textbox');
      expect(textAreaField).toHaveClass(`${ComponentClassName.Field}--small`);
      expect(textArea).toHaveClass(`${ComponentClassName.Textarea}--small`);
    });

    it('should render size classes for TextAreaField', async () => {
      render(
        <div>
          <TextAreaField size="small" testId="small" label="small" />
          <TextAreaField size="large" testId="large" label="large" />
        </div>
      );

      const small = await screen.findByTestId('small');
      const large = await screen.findByTestId('large');

      expect(small.classList).toContain(
        `${ComponentClassName['Field']}--small`
      );
      expect(large.classList).toContain(
        `${ComponentClassName['Field']}--large`
      );
    });

    it('can set defaultValue', async () => {
      render(<TextAreaField label="Field" defaultValue="test" />);

      const field = await screen.findByRole<HTMLTextAreaElement>('textbox');
      expect(field.value).toBe('test');
    });

    it('show add aria-invalid attribute to textarea when hasError', async () => {
      render(
        <TextAreaField
          label="Field"
          id="testField"
          hasError
          errorMessage={'Error message'}
        />
      );
      const field = await screen.findByRole('textbox');
      expect(field).toHaveAttribute('aria-invalid');
    });

    it('should set resize style property', async () => {
      render(<TextAreaField label="Field" resize="horizontal" />);
      const field = await screen.findByRole('textbox');
      expect(field).toHaveStyle('resize: horizontal');
    });

    it('should fire event handlers', async () => {
      const onChange = jest.fn();
      const onInput = jest.fn();
      const onPaste = jest.fn();
      render(
        <TextAreaField
          label="Field"
          onChange={onChange}
          onInput={onInput}
          onPaste={onPaste}
        />
      );
      const field = await screen.findByRole('textbox');
      userEvent.type(field, 'hello');
      userEvent.paste(field, 'there');
      expect(onChange).toHaveBeenCalled();
      expect(onInput).toHaveBeenCalled();
      expect(onPaste).toHaveBeenCalled();
    });
  });

  describe('error messages', () => {
    const errorMessage = 'This is an error message';
    it("don't show when hasError is false", () => {
      render(
        <TextAreaField
          label="Field"
          id="testField"
          errorMessage={errorMessage}
        />
      );

      const errorText = screen.queryByText(errorMessage);
      expect(errorText).not.toBeInTheDocument();
    });

    it('show when hasError and errorMessage', () => {
      render(
        <TextAreaField
          label="Field"
          id="testField"
          hasError
          errorMessage={errorMessage}
        />
      );
      const errorText = screen.queryByText(errorMessage);
      expect(errorText?.innerHTML).toContain(errorMessage);
    });
  });

  describe('descriptive message', () => {
    it('renders when descriptiveText is provided', () => {
      render(
        <TextAreaField
          label="Field"
          id="testField"
          descriptiveText="Description"
        />
      );

      const descriptiveText = screen.queryByText('Description');
      expect(descriptiveText?.innerHTML).toContain('Description');
    });

    it('should map to descriptive text correctly', async () => {
      const descriptiveText = 'Description';
      render(
        <TextAreaField
          descriptiveText={descriptiveText}
          label="Field"
          id="testField"
        />
      );

      const field = await screen.findByRole('textbox');
      expect(field).toHaveAccessibleDescription(descriptiveText);
    });
  });
});

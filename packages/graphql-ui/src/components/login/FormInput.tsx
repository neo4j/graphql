export interface Props {
    id: string;
    name: string;
    label: string;
    type: string;
    placeholder: string;
    defaultValue?: string;
    required: boolean;
    disabled?: boolean;
}

export const FormInput = (props: Props) => {
    return (
        <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">{props.label}</label>
            <input
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id={props.id}
                name={props.name}
                type={props.type}
                placeholder={props.placeholder}
                required={true}
                defaultValue={props.defaultValue}
                disabled={props.disabled}
            />
        </div>
    );
};

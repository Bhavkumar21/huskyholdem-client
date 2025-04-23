import "./CyberPunkButton.css"

interface RegisterButtonProps {
    onClick?: () => void;
    className?: string;
    disabled?: boolean;
    text: string;
}

const CyberPunkButton: React.FC<RegisterButtonProps> = (
    props
) => {
    return <button className={"cyberpunk-btn " + props.className} disabled={props.disabled || false} >{props.text}</button>;
}

export default CyberPunkButton;


// Input컴포넌트 만들기
import styles from './Input.module.css'
import { forwardRef } from "react";

//Ref 요소를 전달받으려면 forwardRef 처리가 되어야한다. 일반 컴포넌트는 ref prop을 전달받을 수 없다.
const Input = forwardRef(function Input(
    {
        label,
        error,
        helperText,
        fullWidth = false,
        className = '',
        required = false,
        ...props
    },
    ref
){
    const inputClass = [
        styles.input,
        error ? styles.error : '',
        fullWidth ? styles.fullWidth : '',
        className,
    ].filter(Boolean).join(' ');


    return (
        <div className={`${styles.wrapper} ${fullWidth?styles.fullWidth : ''}`}>
            {
                label &&
                <label className={styles.label}>
                 {required && <span className={styles.required}>*</span>}
                 {label}
                </label>
            }
            <input ref={ref} className={inputClass} {...props}/>
            {
                (error || helperText) &&(
                    <span className={`${styles.helperText} ${error?styles.errorText:''}`}>
                        {error || helperText}
                    </span>
                )
            }
        </div>
    );
});

export default Input;
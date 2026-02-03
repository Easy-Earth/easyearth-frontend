import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import Button from "../common/Button";
import Modal from "../common/Modal";


// 로그인 모달 컴포넌트
function LoginModal({isOpen,onClose}) {

    const {login} = useAuth();

    const [formData,setFormData] = useState({
        userId : '',
        userPwd : ''
    });

    const [error,setError] = useState('');
    const [isLoading,setIsLoading] = useState(false);

    const handleChange = (e) =>{
        const {name,value} = e.target;

        setFormData((prev)=>({
            ...prev,
            [name] : value,
        }));
        setError('');
    };

    const handleSubmit = async (e) =>{
        e.preventDefault();//기본동작 막기(submit)
        setIsLoading(true);
        setError('');

        //로그인 함수 받아온걸로 결과 처리 
        const result = await login(formData);

        if(result.success){
            onClose();
            setFormData({userId: '',userPwd : ''});
        }else{
            setError(result.message);
        }


        setIsLoading(false);

    };


    const handleClose = () =>{
        setFormData({userId : '',userPwd : ''});
        setError('');
        onClose();
    }

    return(
        
        // 모달 위치 
        <Modal isOpen={isOpen} onClose={handleClose} title='로그인' size='sm'>
            <form onSubmit={handleSubmit} className={styles.form}>
                {/* input 요소들 위치 */}
                 <Input
                    label="ID"
                    type="text"
                    name="userId"
                    value={formData.userId}
                    onChange={handleChange}
                    placeholder='아이디를 입력하세요'
                    required
                    fullWidth
                 />
                 
                 <Input
                    label="Password"
                    type="password"
                    name="userPwd"
                    value={formData.userPwd}
                    onChange={handleChange}
                    placeholder='비밀번호를 입력하세요'
                    required
                    fullWidth
                 />


                {error && <p className={styles.error}>{error}</p>}

                <div className={styles.buttons}>
                    {/* 버튼들 위치 */}
                    <Button type="submit" variant="primary" fullWidth loading={isLoading}>
                        로그인
                    </Button>

                    <Button type="button" variant="danger" fullWidth onClick={handleClose}>
                        취소
                    </Button>

                </div>

            </form>
        </Modal>

    );


}

export default LoginModal;
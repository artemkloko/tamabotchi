pipeline {
    agent any
 
    stages {
        stage('docker build') {
            steps {
                script {
                    docker.build("artemkloko/tamabotchi")
                }
            }
        }
    }
}
